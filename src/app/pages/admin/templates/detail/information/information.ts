import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { TemplateDataMongoI, TemplateI } from 'app/core/interfaces/template.interface';
import { TemplateService } from 'app/core/services/templates.service';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';
import { GridComponent } from 'app/shared/components/grid/grid';
import { PageService } from 'app/core/services/pages.service';
import { SitieService } from 'app/core/services/sitie.service';

@Component({
  selector: 'templates-information',
  templateUrl: './information.html',
  imports: [FormsModule, ReactiveFormsModule, PermissionComponent, GridComponent],
})
export class TemplatesInformationComponent implements OnInit, OnDestroy {
  private readonly _formBuilder = inject(UntypedFormBuilder);
  private readonly _templateService = inject(TemplateService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _pageService = inject(PageService);
  private readonly _sitieService = inject(SitieService);
  private readonly _router = inject(Router);

  private _unsubscribeAll: Subject<any> = new Subject<any>();
  private styleElement?: HTMLStyleElement;

  permission = PermissionCode;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  template = toSignal(this._templateService.template$, { initialValue: null });
  sitie = toSignal(this._sitieService.sitie$, { initialValue: null });

  templateForm!: UntypedFormGroup;

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
    this.templateForm = this._formBuilder.group({
      name: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      status: [],
    });

    const template = this.template();

    if (template) {
      this.templateForm.patchValue({ ...template });
      this.loadTemplate(template);
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
   * Go to Canvas
   */
  goToCanvas(): void {
    this._router.navigateByUrl('/admin/content/templates/canvas', {
      state: {
        id: this.template() === null ? 0 : this.template()!.id,
      },
    });
  }

  /**
   * Add page
   * @returns
   */
  create(): void {
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      return;
    }

    this.templateForm.disable();

    // ADD data
    this.templateForm.value.data = {
      header: {
        css: '.header{}',
        data: [],
        config: { backgroundImage: '' },
      },
      footer: {
        css: '.footer{}',
        data: [],
        config: { backgroundImage: '' },
      },
    } as TemplateDataMongoI;

    //Delete status
    delete this.templateForm.value.status;

    this._templateService
      .create(this.templateForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.templateForm.enable();
          this._toastrService.success('La plantilla se creó correctamente.', 'Plantilla creada');
          this._router.navigateByUrl('/admin/content/templates');
        },
        error: (response) => {
          this.templateForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible crear la plantilla.',
            'Error al crear',
          );
        },
      });
  }

  /**
   * Update page
   */
  update() {
    // Return if the form is invalid
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      return;
    }

    const template = this.template();

    if (!template === null) return;

    // Disable the form
    this.templateForm.disable();

    this._templateService
      .update(template?.id!, this.templateForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.templateForm.enable();
          this._toastrService.success(
            'La informacion de la plantilla se actualizó correctamente.',
            'Plantilla actualizada',
          );
        },
        error: (response) => {
          this.templateForm.enable();
          // Set the alert
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar la informacion de la plantilla.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Cancel changes
   */
  cancel(): void {
    const template = this.template();

    this.templateForm.reset();

    if (template) {
      this.templateForm.patchValue({ ...template });
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
