import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import {
  FormControl,
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
  selector: 'parameters-email',
  templateUrl: './email.html',
  imports: [FormsModule, ReactiveFormsModule],
})
export class ParametersEmailComponent implements OnInit {
  parameters = input.required<ParameterI[]>();
  edit = input.required<boolean>();
  refreshParameters = output<boolean>();

  passwordVisible = signal<boolean>(false);

  emailForm!: UntypedFormGroup;
  emailTestControl!: FormControl;
  validateFormControl = CmsValidators.validateFormControl;
  validateOnlyFormControl = CmsValidators.validateOnlyFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;
  getErrorMessageFormControl = CmsValidators.getErrorMessageFormControl;

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
    this.emailForm = this._formBuilder.group({
      host: ['', Validators.required],
      port: ['', [Validators.required, Validators.pattern('^-?[0-9]+$')]],
      username: ['', Validators.required],
      password: ['', Validators.required],
      email: ['', [Validators.email, Validators.required]],
      secure: [''],
    });

    this.emailTestControl = new FormControl('', [Validators.email, Validators.required]);

    this.emailForm.patchValue({ ...this.getEmailParameters() });
    if (!this.edit()) this.emailForm.disable();
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
  getEmailParameters() {
    return {
      host: this.getParameter('MAILER_HOST'),
      port: this.getParameter('MAILER_PORT'),
      username: this.getParameter('MAILER_USER'),
      password: this.getParameter('MAILER_PASSWORD'),
      email: this.getParameter('MAILER_FROM'),
      secure: this.getParameter('MAILER_SECURE') === 'true',
    };
  }

  /**
   * Cancel action
   */
  cancel() {
    this.emailForm.reset();
    this.emailForm.patchValue({ ...this.getEmailParameters() });
  }

  /**
   * Save action
   */
  save() {
    // Return if the form is invalid
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.emailForm.disable();

    this._parameterService
      .updateMultiple(this.getValueEmailForm())
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.emailForm.enable();
          this._toastrService.success(
            'Los parámetros se actualizaron correctamente.',
            'Parámetros actualizados',
          );
          this.refreshParameters.emit(true);
        },
        error: (response) => {
          this.emailForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar los parámetros.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Test email
   * @returns
   */
  testEmail() {
    // Return if the form is invalid
    if (this.emailTestControl.invalid) {
      this.emailTestControl.markAllAsTouched();
      return;
    }

    // Disable the form
    this.emailTestControl.disable();

    this._parameterService
      .testEmail(this.emailTestControl.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.emailTestControl.enable();
          this._toastrService.success(
            'Se ha enviado el correo electrónico, revisa tu bandeja de entrada o spam.',
            'Correo enviado',
          );
        },
        error: (response) => {
          this.emailTestControl.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible enviar el correo electrónico.',
            'Error enviar correo',
          );
        },
      });
  }

  /**
   * Get value of email parameters
   */
  getValueEmailForm(): ParameterI[] {
    const parameters: ParameterI[] = [];
    parameters.push(this.getObjectParameter('MAILER_HOST', 'host'));
    parameters.push(this.getObjectParameter('MAILER_PORT', 'port'));
    parameters.push(this.getObjectParameter('MAILER_USER', 'username'));
    parameters.push(this.getObjectParameter('MAILER_PASSWORD', 'password'));
    parameters.push(this.getObjectParameter('MAILER_FROM', 'email'));
    parameters.push(this.getObjectParameter('MAILER_SECURE', 'secure'));
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
      value: String(this.emailForm.get(value)?.value),
    };
  }

  /**
   * Change value of visibility of password
   */
  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }
}
