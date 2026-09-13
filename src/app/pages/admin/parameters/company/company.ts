import { Component, OnInit, inject, input, isDevMode, output } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { ParameterService } from 'app/core/services/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'parameters-company',
  templateUrl: './company.html',
  imports: [FormsModule, ReactiveFormsModule],
})
export class ParametersCompanyComponent implements OnInit {
  parameters = input.required<ParameterI[]>();
  edit = input.required<boolean>();
  refreshParameters = output<boolean>();

  companyForm!: UntypedFormGroup;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _formBuilder = inject(UntypedFormBuilder);

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    const websitePatternValidator = Validators.pattern(
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    );

    // Create the form
    this.companyForm = this._formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      urlStatics: ['', [Validators.required]],
      website: ['', [Validators.required, websitePatternValidator]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      country: ['', Validators.required],
    });

    if (isDevMode()) {
      this.companyForm.controls['website'].removeValidators(websitePatternValidator);
    }

    this.companyForm.patchValue({ ...this.getCompanyParameters() });
    if (!this.edit()) this.companyForm.disable();
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
   * Get parameter
   * @param code
   */
  getParameter(code: string) {    
    if (this.parameters().length > 0) {
      return findParameter(code, this.parameters())!.value;
    }

    return '';
  }

  /**
   * Get parameters
   * @returns
   */
  getCompanyParameters() {
    return {
      name: this.getParameter('COMPANY_NAME'),
      description: this.getParameter('COMPANY_DESCRIPTION'),
      website: this.getParameter('COMPANY_WEBSITE'),
      urlStatics: this.getParameter('APP_STATICS_URL'),
      email: this.getParameter('COMPANY_MAIL'),
      phone: this.getParameter('COMPANY_PHONE'),
      country: this.getParameter('COMPANY_COUNTRY'),
    };
  }

  /**
   * Save action
   */
  save() {
    // Return if the form is invalid
    if (this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.companyForm.disable();

    this._parameterService
      .updateMultiple(this.getValueCompanyForm())
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.companyForm.enable();
          this._toastrService.success(
            'Los parámetros se actualizaron correctamente.',
            'Parámetros actualizados',
          );
          this.refreshParameters.emit(true);
        },
        error: (response) => {
          this.companyForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar los parámetros.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Get value of company parameters
   */
  getValueCompanyForm(): ParameterI[] {
    const parameters: ParameterI[] = [];
    parameters.push(this.getObjectParameter('COMPANY_NAME', 'name'));
    parameters.push(this.getObjectParameter('COMPANY_DESCRIPTION', 'description'));
    parameters.push(this.getObjectParameter('COMPANY_WEBSITE', 'website'));
    parameters.push(this.getObjectParameter('APP_STATICS_URL', 'urlStatics'));
    parameters.push(this.getObjectParameter('COMPANY_MAIL', 'email'));
    parameters.push(this.getObjectParameter('COMPANY_PHONE', 'phone'));
    parameters.push(this.getObjectParameter('COMPANY_COUNTRY', 'country'));
    return parameters;
  }

  /**
   * Return parameter
   * @param code
   * @param value
   * @returns
   */
  getObjectParameter(code: string, value: string): ParameterI {
    return {
      code,
      value: this.companyForm.get(value)?.value,
    };
  }

  /**
   * Cancel action
   */
  cancel() {
    this.companyForm.reset();
    this.companyForm.patchValue({ ...this.getCompanyParameters() });
  }
}
