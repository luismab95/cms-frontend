import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { PageService } from 'app/core/services/pages.service';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { LanguageService } from 'app/shared/services/language.service';
import {
  OnlyPageDetailReferenceI,
  PageDetailReferenceI,
  PageI,
} from 'app/core/interfaces/page.interface';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { ParameterService } from 'app/core/services/parameter.service';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { TabsComponent } from 'app/shared/components/tabs/tabs';
import { TabI } from 'app/shared/interfaces/drawer.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'pages-languages',
  templateUrl: './languages.html',
  imports: [FormsModule, ReactiveFormsModule, PermissionComponent, TabsComponent],
})
export class PagesLangugesComponent implements OnDestroy {
  urlStatics = signal<string>('');
  selectedLanguage = signal<number>(0);
  tabs = signal<TabI[]>([]);

  languageForm!: UntypedFormGroup;
  permission = PermissionCode;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _microsityService = inject(MicrosityService);
  private readonly _pageService = inject(PageService);
  private readonly _languageService = inject(LanguageService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _formBuilder = inject(FormBuilder);

  readonly micrositie = toSignal(this._microsityService.micrositie$, {
    initialValue: null,
  });
  readonly page = toSignal(this._pageService.page$, {
    initialValue: null,
  });
  readonly languages = toSignal(this._languageService.languages$, {
    initialValue: {
      records: [],
      total: 0,
      page: 0,
      totalPage: 0,
    },
  });
  readonly parameters = toSignal(this._parameterService.parameter$, {
    initialValue: [],
  });
  readonly selectedLanguageForm = computed(
    () => this.languagesFormArray.at(this.selectedLanguage()) as UntypedFormGroup,
  );

  constructor() {
    this.languageForm = this._formBuilder.group({
      languages: this._formBuilder.array([]),
    });

    effect(() => {
      const languages = this.languages().records;
      if (!languages.length) {
        return;
      }

      if (this.languagesFormArray.length === 0) {
        languages.forEach((language) => {
          this.addLanguage(language.id);
        });
      }

      if (this.selectedLanguage() >= languages.length) {
        this.selectedLanguage.set(0);
      }

      const tabs: TabI[] = languages.map(
        (lang, index) =>
          ({
            id: index,
            icon: this.getICon(lang.icon),
            type: 'image',
            title: lang.name,
            description: lang.lang,
          }) as TabI,
      );

      this.tabs.set(tabs);
    });

    effect(() => {
      const page = this.page();
      if (page?.details) {
        this.patchLanguagesWithData(page.details);
      }
    });

    effect(() => {
      const parameters = this.parameters();
      const parameter = findParameter('APP_STATICS_URL', parameters);
      if (parameter) {
        this.urlStatics.set(parameter.value);
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  /**
   * FormArray de idiomas
   */
  get languagesFormArray(): FormArray {
    return this.languageForm.get('languages') as FormArray;
  }

  /**
   * Agrega un idioma al FormArray
   */
  addLanguage(languageId?: number): void {
    const newLanguageGroup = this._formBuilder.group({
      alias: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      keywords: ['', Validators.required],
      languageId: [languageId ?? '', Validators.required],
    });
    this.languagesFormArray.push(newLanguageGroup);
  }

  /**
   * Selecciona un idioma por su INDEX.
   */
  selectLanguage(index: number): void {
    this.selectedLanguage.set(index);
  }

  /**
   * Elimina un idioma
   */
  removeLanguage(index: number): void {
    this.languagesFormArray.removeAt(index);
    if (this.selectedLanguage() >= this.languagesFormArray.length) {
      this.selectedLanguage.set(Math.max(0, this.languagesFormArray.length - 1));
    }
  }

  /**
   * Carga la información de la página
   * dentro de los formularios de cada idioma.
   */
  patchLanguagesWithData(data: PageDetailReferenceI[]): void {
    data.forEach((language) => {
      const index = this.languages().records.findIndex((item) => item.id === language.languageId);
      if (index === -1) {
        return;
      }

      const languageControl = this.languagesFormArray.at(index);
      if (!languageControl) {
        return;
      }

      languageControl.patchValue({
        alias: language.alias?.text ?? '',
        description: language.description?.text ?? '',
        keywords: language.keywords?.text ?? '',
        languageId: language.languageId ?? '',
      });
    });
  }

  /**
   * Actualiza la página
   */
  update(): void {
    if (this.languageForm.invalid) {
      this.languageForm.markAllAsTouched();

      const invalidIndex = this.languagesFormArray.controls.findIndex((control) => control.invalid);

      if (invalidIndex !== -1) {
        this.selectedLanguage.set(invalidIndex);
      }

      return;
    }

    this.languageForm.disable();

    const page = this.page();
    if (page === null) {
      this.languageForm.enable();
      return;
    }

    const updatePage: PageI = {
      name: page.name,
      detail: [],
    };

    const languages = this.languageForm.getRawValue().languages as OnlyPageDetailReferenceI[];
    languages.forEach((language) => {
      updatePage.detail!.push({
        lang: language.languageId,
        references: [
          {
            ref: page.aliasRef!,
            value: language.alias!,
          },
          {
            ref: page.descriptionRef!,
            value: language.description,
          },
          {
            ref: page.seoKeywordsRef!,
            value: language.keywords,
          },
        ],
      });
    });

    this._pageService
      .update(page.id!, updatePage)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.languageForm.enable();
          this._toastrService.success(
            'La informacion de idiomas de la página se actualizó correctamente.',
            'Página actualizada',
          );
        },
        error: (response) => {
          this.languageForm.enable();
          this._toastrService.error(
            response.error?.message ||
              'No fue posible actualizar la informacion de idiomas de la página.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Cancela los cambios
   */
  cancel(): void {
    const page = this.page();
    this.languageForm.reset();

    if (page?.details) {
      this.patchLanguagesWithData(page.details);
    }
  }

  /**
   * Obtiene el nombre del idioma
   */
  getLanguageName(id: number): string {
    const language = this.languages().records.find((language) => language.id === id);
    return language?.name ?? '';
  }

  /**
   * Permisos
   */
  validPermission(code: string): boolean {
    return validAction(code);
  }

  /**
   * URL del icono
   */
  getICon(icon: string): string {
    return `${this.urlStatics()}/${icon}`;
  }
}
