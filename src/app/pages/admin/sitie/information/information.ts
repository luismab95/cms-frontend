import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { TemplateI } from 'app/core/interfaces/template.interface';
import { SitieService } from 'app/core/services/sitie.service';
import { TemplateService } from 'app/core/services/templates.service';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { GridComponent } from 'app/shared/components/grid/grid';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { PageService } from 'app/core/services/pages.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'sitie-information',
  templateUrl: './information.html',
  imports: [FormsModule, ReactiveFormsModule, PermissionComponent, GridComponent, TooltipDirective],
})
export class SitieInformationComponent implements OnInit {
  selectedTemplate = signal(0);

  private readonly _formBuilder = inject(UntypedFormBuilder);
  private readonly _sitieService = inject(SitieService);
  private readonly _templateService = inject(TemplateService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _pageService = inject(PageService);

  private _unsubscribeAll: Subject<any> = new Subject<any>();
  private styleElement?: HTMLStyleElement;

  permission = PermissionCode;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  sitie = toSignal(this._sitieService.sitie$, { initialValue: null });
  templates = toSignal(this._templateService.templates$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  sitieForm!: UntypedFormGroup;

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
    this.sitieForm = this._formBuilder.group({
      name: ['', Validators.required],
      domain: [
        '',
        [Validators.required, Validators.pattern(/^https?:\/\/[a-zA-Z0-9.-]+(:\d+)?(\/.*)?$/)],
      ],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      status: [],
      maintenance: [],
      templateId: ['', Validators.required],
    });

    const sitie = this.sitie();

    if (sitie) {
      this.sitieForm.patchValue(sitie);
      const index = this.templates().records.findIndex((template) => template.id === 1);
      this.selectedTemplate.set(index);
      const findTemplate = this.currentTemplate;
      if (findTemplate === null) return;
      this.loadTemplate(findTemplate);
    }
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
    const domain = this.sitie()?.domain;

    if (domain) {
      window.open(domain, '_blank');
    }
  }

  /**
   * Save Changes
   * @returns
   */
  save(): void {
    if (this.sitieForm.invalid) {
      this.sitieForm.markAllAsTouched();
      return;
    }

    const sitie = this.sitie();

    if (!sitie) {
      return;
    }

    this.sitieForm.disable();

    this._sitieService
      .update(sitie.id!, this.sitieForm.getRawValue())
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.sitieForm.enable();
          this._toastrService.success('El sitio se actualizó correctamente.', 'Sitio actualizado');
        },
        error: (response) => {
          this.sitieForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar la configuración del sitio.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Cancel changes
   */
  cancel(): void {
    const sitie = this.sitie();

    this.sitieForm.reset();

    if (sitie) {
      this.sitieForm.patchValue(sitie);
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
      this.sitieForm.get('templateId')?.setValue(templateId);
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
    this._templateService.template = template;
    // Eliminar CSS anterior
    this.styleElement?.remove();

    this.styleElement = document.createElement('style');
    this.styleElement.textContent = ` ${template.data?.header.css ?? ''} ${template.data?.footer.css ?? ''}`;
    document.head.appendChild(this.styleElement);
  }
}
