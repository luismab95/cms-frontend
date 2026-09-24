import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { TemplateI } from 'app/core/interfaces/template.interface';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { PageService } from 'app/core/services/pages.service';
import { SitieService } from 'app/core/services/sitie.service';
import { TemplateService } from 'app/core/services/templates.service';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { GridComponent } from 'app/shared/components/grid/grid';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'microsities-information',
  templateUrl: './information.html',
  imports: [FormsModule, ReactiveFormsModule, GridComponent, TooltipDirective],
})
export class MicrositieInformationComponent implements OnInit {
  selectedTemplate = signal(0);

  private readonly _formBuilder = inject(UntypedFormBuilder);
  private readonly _sitieService = inject(SitieService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _domSanitizer = inject(DomSanitizer);
  private readonly _pageService = inject(PageService);
  private readonly _templateService = inject(TemplateService);

  private _unsubscribeAll: Subject<any> = new Subject<any>();
  private styleElement?: HTMLStyleElement;

  permission = PermissionCode;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  sitie = toSignal(this._sitieService.sitie$, { initialValue: null });
  micrositie = toSignal(this._microsityService.micrositie$, { initialValue: null });
  templates = toSignal(this._templateService.templates$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  micrositieForm!: UntypedFormGroup;

  previewDefaultPage = computed(() => {
    const micrositie = this.micrositie();
    return this._domSanitizer.bypassSecurityTrustResourceUrl(
      `${this.sitie()?.domain}/preview/${micrositie?.path}`,
    );
  });

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * OnInit
   */
  ngOnInit(): void {
    this.micrositieForm = this._formBuilder.group({
      name: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      sitieId: ['', Validators.required],
      templateId: [Validators.required],
      status: [],
    });

    const micrositie = this.micrositie();

    if (micrositie) {
      this.micrositieForm.patchValue({ ...micrositie});
      const index = this.templates().records.findIndex((template) => template.id === 1);
      this.selectedTemplate.set(index);
    } else {
      this.selectedTemplate.set(0);
    }

    const findTemplate = this.currentTemplate;
    if (findTemplate === null) return;
    this.loadTemplate(findTemplate);
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Go to Sitie
   */
  visit(): void {
    const domain = `${this.sitie()?.domain}/${this.micrositie()?.path}`;

    if (domain) {
      window.open(domain, '_blank');
    }
  }

  /**
   * Add micrositie
   * @returns
   */
  create(): void {
    if (this.micrositieForm.invalid) {
      this.micrositieForm.markAllAsTouched();
      return;
    }

    this.micrositieForm.disable();

    // ADD data

    if (this.sitie() !== null) {
      this.micrositieForm.value['sitieId'] = this.sitie()!.id;
    }

    this._microsityService
      .create(this.micrositieForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.micrositieForm.enable();
          this._toastrService.success('El micrositio se creó correctamente.', 'Micrositio creado');
        },
        error: (response) => {
          this.micrositieForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible crear el micrositio.',
            'Error al crear',
          );
        },
      });
  }

  /**
   * Update micrositie
   */
  update() {
    // Return if the form is invalid
    if (this.micrositieForm.invalid) {
      this.micrositieForm.markAllAsTouched();
      return;
    }

    const micrositie = this.micrositie();

    if (!micrositie === null) return;

    // Disable the form
    this.micrositieForm.disable();

    this._microsityService
      .update(micrositie?.id!, this.micrositieForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.micrositieForm.enable();
          this._toastrService.success(
            'La informacion del micrositio se actualizó correctamente.',
            'Micrositio actualizado',
          );
        },
        error: (response) => {
          this.micrositieForm.enable();
          // Set the alert
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar la informacion del micrositio.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Cancel changes
   */
  cancel(): void {
    const micrositie = this.micrositie();

    this.micrositieForm.reset();

    if (micrositie) {
      this.micrositieForm.patchValue(micrositie);
    }
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
   * next carousel
   */
  next(): void {
    this.selectedTemplate.update((index) =>
      index === this.templates().records.length - 1 ? 0 : index + 1,
    );
    const template = this.currentTemplate;
    if (template === null) return;
    this.loadTemplate(template);
  }

  /**
   * previous carousel
   */
  previous(): void {
    this.selectedTemplate.update((index) =>
      index === 0 ? this.templates().records.length - 1 : index - 1,
    );
    const template = this.currentTemplate;
    if (template === null) return;
    this.loadTemplate(template);
  }

  /**
   * Change template
   * @param id
   * @returns
   */
  selectTemplate(id: number): void {
    this.selectedTemplate.set(id);
    const template = this.currentTemplate;
    if (template === null) return;
    this.loadTemplate(template);
  }

  /**
   * Get index of current template
   */
  get currentTemplate(): TemplateI {
    return this.templates().records[this.selectedTemplate()] ?? null;
  }

  /**
   * Change template in siite
   * @param templateId
   * @param event
   */
  onSelectTemplate(templateId: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.micrositieForm.get('templateId')?.setValue(templateId);
      const template = this.templates().records.find((template) => template.id === templateId)!;
      if (template === null) return;
      this.loadTemplate(template);
    }
  }

  /**
   * Load template
   * @param template
   */
  loadTemplate(template: TemplateI) {
    this._pageService.sectionsHeader = template.data?.header.data ?? [];
    this._pageService.sectionsFooter = template.data?.footer.data ?? [];

    // Eliminar CSS anterior
    this.styleElement?.remove();

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = ` ${template.data?.header.css ?? ''} ${template.data?.footer.css ?? ''}`;
    document.head.appendChild(this.styleElement);
  }
}
