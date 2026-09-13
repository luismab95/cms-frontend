import { Component, OnInit, inject, input, output } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { NgLabelTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { ParameterService } from 'app/core/services/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'parameters-security',
  templateUrl: './security.html',
  imports: [FormsModule, ReactiveFormsModule, NgSelectComponent, NgLabelTemplateDirective],
})
export class ParametersSecurityComponent implements OnInit {
  parameters = input.required<ParameterI[]>();
  edit = input.required<boolean>();
  refreshParameters = output<boolean>();

  securityForm!: UntypedFormGroup;
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
    // Create the form
    this.securityForm = this._formBuilder.group({
      inactivity: ['', [Validators.required, Validators.pattern('^-?[0-9]+$')]],
      attemps: ['', [Validators.required, Validators.pattern('^-?[0-9]+$')]],
      pwdLong: ['', [Validators.required, Validators.pattern('^-?[0-9]+$')]],
      pwdNumber: [],
      pwdMayus: [],
      pwdSpecial: [],
      optTime: ['', [Validators.required, Validators.pattern('^-?[0-9]+$')]],
      otpLong: ['', [Validators.required, Validators.pattern('^-?[0-9]+$')]],
      otpType: ['', Validators.required],
    });

    this.securityForm.patchValue({ ...this.getSecurityParameters() });
    if (!this.edit()) this.securityForm.disable();
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
  getSecurityParameters() {
    return {
      otpType: this.getParameter('OTP_TYPE'),
      otpLong: this.getParameter('OTP_LONG'),
      optTime: this.getParameter('OTP_TIME_RESEND'),
      attemps: this.getParameter('APP_ATTEMPS_LOGIN'),
      inactivity: this.getParameter('APP_INACTIVITY'),
      pwdLong: this.getParameter('APP_PWD_LONG'),
      pwdSpecial: this.getParameter('APP_PWD_SPECIAL') === 'true',
      pwdMayus: this.getParameter('APP_PWD_MAYUS') === 'true',
      pwdNumber: this.getParameter('APP_PWD_NUMBER') === 'true',
    };
  }

  /**
   * Cancel action
   */
  cancel() {
    this.securityForm.reset();
    this.securityForm.patchValue({ ...this.getSecurityParameters() });
  }

  /**
   * Save action
   */
  save() {
    // Return if the form is invalid
    if (this.securityForm.invalid) {
      this.securityForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.securityForm.disable();

    this._parameterService
      .updateMultiple(this.getValueSecurityForm())
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.securityForm.enable();
          this._toastrService.success(
            'Los parámetros se actualizaron correctamente.',
            'Parámetros actualizados',
          );
          this.refreshParameters.emit(true);
        },
        error: (response) => {
          this.securityForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar los parámetros.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Get value of security parameters
   */
  getValueSecurityForm(): ParameterI[] {
    const parameters: ParameterI[] = [];
    parameters.push(this.getObjectParameter('OTP_TYPE', 'otpType'));
    parameters.push(this.getObjectParameter('OTP_LONG', 'otpLong'));
    parameters.push(this.getObjectParameter('OTP_TIME_RESEND', 'optTime'));
    parameters.push(this.getObjectParameter('APP_ATTEMPS_LOGIN', 'attemps'));
    parameters.push(this.getObjectParameter('APP_INACTIVITY', 'inactivity'));
    parameters.push(this.getObjectParameter('APP_PWD_LONG', 'pwdLong'));
    parameters.push(this.getObjectParameter('APP_PWD_SPECIAL', 'pwdMayus'));
    parameters.push(this.getObjectParameter('APP_PWD_MAYUS', 'pwdMayus'));
    parameters.push(this.getObjectParameter('APP_PWD_NUMBER', 'pwdNumber'));
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
      value: String(this.securityForm.get(value)?.value),
    };
  }
}
