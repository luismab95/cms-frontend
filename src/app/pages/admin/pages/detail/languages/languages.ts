import { NgClass } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  applyEach,
  disabled,
  form,
  FormField,
  maxLength,
  required,
  submit,
} from '@angular/forms/signals';
import { PageDetailReferenceI, PageI } from '@core/interfaces';
import { MicrosityService, PageService, ParameterService } from '@core/services';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { TabsComponent } from '@shared/components';
import { LanguagesFormModel, TabI } from '@shared/interfaces';
import { LanguageService } from '@shared/services';
import { PermissionCode, findParameter, hasErrorFormField, validAction } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'pages-languages',
  templateUrl: './languages.html',
  imports: [TabsComponent, FormField, NgClass],
})
export class PagesLangugesComponent {
  selectedLanguage = signal<number>(0);
  tabs = signal<TabI[]>([]);
  languageModel = signal<LanguagesFormModel>({
    languages: [],
  });

  languageForm = form(this.languageModel, (path) => {
    applyEach(path.languages, (language) => {
      required(language['alias'], {
        message: 'Alias es obligatorio.',
      });
      required(language['description'], {
        message: 'Descripción es obligatoria.',
      });
      maxLength(language['description'], 255, {
        message: 'Descripción no puede superar los 255 caracteres.',
      });
      required(language['keywords'], {
        message: 'Palabras clave son obligatorias.',
      });
      maxLength(language['keywords'], 255, {
        message: 'Palabras clave no puede superar los 255 caracteres.',
      });
    });
    disabled(path, {
      when: () => !this.validPermission(this.permission.editPage),
    });
  });

  private readonly _microsityService = inject(MicrosityService);
  private readonly _pageService = inject(PageService);
  private readonly _languageService = inject(LanguageService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly hasError = hasErrorFormField;
  readonly micrositie = this._microsityService.micrositie;
  readonly page = this._pageService.page;
  readonly languages = this._languageService.languages;
  readonly parameters = this._parameterService.publicParameters;

  readonly urlStatics = computed(() => findParameter('APP_STATICS_URL', this.parameters())?.value);

  constructor() {
    effect(() => {
      const languages = this.languages().records;

      if (languages.length === 0) return;

      this.languageModel.update((prev) => ({
        ...prev,
        languages: languages.map((lang) => {
          const existing = prev.languages.find((item) => item.languageId === lang.id!.toString());

          return (
            existing ?? {
              languageId: lang.id!.toString(),
              alias: '',
              description: '',
              keywords: '',
            }
          );
        }),
      }));

      this.selectedLanguage.set(0);

      this.tabs.set(
        languages.map(
          (lang, index) =>
            ({
              id: index,
              icon: this.getICon(lang.icon),
              type: 'image',
              title: lang.name,
              description: lang.lang,
            }) as TabI,
        ),
      );
    });

    effect(() => {
      const page = this.page();
      if (!page || !page.details) return;
      untracked(() => {
        this.patchLanguagesWithData(page.details!);
      });
    });
  }

  /**
   * Add language to model
   * @param languageId
   */
  addLanguage(languageId: number): void {
    const languages = this.languageModel().languages;
    languages.push({
      languageId: languageId.toString(),
      alias: '',
      description: '',
      keywords: '',
    });
    this.languageModel.update((prev) => ({ ...prev, languages }));
  }

  /**
   * Select language
   * @param index
   */
  selectLanguage(index: number): void {
    this.selectedLanguage.set(index);
  }

  /**
   * load language data
   * @param data
   */
  patchLanguagesWithData(data: PageDetailReferenceI[]): void {
    data.forEach((language) => {
      this.languageModel.update((prev) => {
        const languages = prev.languages;
        const findLanguage = languages.find(
          (lang) => lang.languageId === language.languageId.toString(),
        );

        if (!findLanguage) return prev;

        const updateLanguage = {
          ...findLanguage,
          alias: language.alias?.text ?? '',
          description: language.description?.text ?? '',
          keywords: language.keywords?.text ?? '',
        };

        return {
          ...prev,
          languages: languages.map((lang) =>
            lang.languageId === language.languageId.toString() ? updateLanguage : lang,
          ),
        };
      });
    });
  }

  /**
   * Update page
   * @param event
   * @returns
   */
  async update(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.languageForm, async (field) => {
        const page = this.page();
        if (!page) return;

        const updatePage: PageI = {
          name: page.name,
          path: page.path,
          detail: [],
        };

        const languages = field().value().languages;
        languages.forEach((language) => {
          updatePage.detail!.push({
            lang: Number(language.languageId),
            references: [
              {
                ref: page.aliasRef!,
                value: language['alias'],
              },
              {
                ref: page.descriptionRef!,
                value: language['description'],
              },
              {
                ref: page.seoKeywordsRef!,
                value: language['keywords'],
              },
            ],
          });
        });
        await firstValueFrom(
          this._pageService.update(page.id!, updatePage).pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success(
          'La informacion de idiomas de la página se actualizó correctamente.',
          'Página actualizada',
        );
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar la informacion de idiomas de la página.',
        'Error al actualizar',
      );
    }
  }

  /**
   * cancel changes
   */
  cancel(): void {
    const page = this.page();

    if (!page || !page.details) return;
    this.patchLanguagesWithData(page.details);
  }

  /**
   * get language name
   * @returns
   */
  getLanguageName(id: number): string {
    const language = this.languages().records.find((language) => language.id === id);
    return language?.name ?? '';
  }

  /**
   * Valid Permission
   * @param code
   * @returns
   */
  validPermission(code: string): boolean {
    return validAction(code);
  }

  /**
   * get langauge icon
   * @returns
   */
  getICon(icon: string): string {
    return `${this.urlStatics()}/${icon}`;
  }
}
