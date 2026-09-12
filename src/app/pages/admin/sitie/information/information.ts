import { Component, OnInit, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { NgLabelTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { SitieService } from 'app/core/services/sitie.service';
import { TemplateService } from 'app/core/services/templates.service';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'sitie-information',
  templateUrl: './information.html',
  imports: [FormsModule, ReactiveFormsModule, PermissionComponent, NgSelectComponent,NgLabelTemplateDirective],
})
export class SitieInformationComponent implements OnInit {
  private readonly _formBuilder = inject(UntypedFormBuilder);
  private readonly _sitieService = inject(SitieService);
  private readonly _templateService = inject(TemplateService);
  private readonly _toastrService = inject(ToastrService);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

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
          this._toastrService.success('Proceso realizado con éxito.', 'Aviso');
        },
        error: (response) => {
          this.sitieForm.enable();
          this._toastrService.error(response.error.message, 'Aviso');
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
}
