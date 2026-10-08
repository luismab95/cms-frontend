import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { email, form, FormField, pattern, required, submit } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { EmailParameterFormI, ParameterI } from '@core/interfaces';
import { ParameterService } from '@core/services';
import { hasErrorFormField, findParameter } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'parameters-email',
  templateUrl: './email.html',
  imports: [FormField, NgClass],
})
export class ParametersEmailComponent {
  parameters = input.required<ParameterI[]>();
  edit = input.required<boolean>();
  refreshParameters = output<boolean>();

  passwordVisible = signal<boolean>(false);
  emailModel = signal<EmailParameterFormI>({
    host: '',
    port: '',
    email: '',
    username: '',
    password: '',
    testEmail: '',
    secure: false,
  });

  emailForm = form(this.emailModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Dirección de correo para envíos es obligatorio.' });
    email(schemaPath.email, { message: 'Dirección de correo para envíos no válido.' });
    email(schemaPath.testEmail, {
      message: 'Dirección de correo electrónico para prueba no válido.',
    });
    required(schemaPath.host, { message: 'Host es obligatorio.' });
    required(schemaPath.port, { message: 'Puerto es obligatorio.' });
    pattern(schemaPath.port, /^-?[0-9]+$/, { message: 'Puerto no valido.' });
    required(schemaPath.username, { message: 'Usuario es obligatorio.' });
    required(schemaPath.password, { message: 'Contraseña es obligatorio.' });
  });

  private _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      this.parameters();
      const emailParameters = this.getEmailParameters();
      this.emailModel.set(emailParameters);
    });
  }

  /**
   * Get parameter
   * @param code
   */
  getParameter(code: string) {
    if (this.parameters().length > 0) return findParameter(code, this.parameters())!.value;
    return '';
  }

  /**
   * Get parameters
   * @returns
   */
  getEmailParameters(): EmailParameterFormI {
    return {
      host: this.getParameter('MAILER_HOST'),
      port: this.getParameter('MAILER_PORT'),
      username: this.getParameter('MAILER_USER'),
      password: this.getParameter('MAILER_PASSWORD'),
      email: this.getParameter('MAILER_FROM'),
      secure: this.getParameter('MAILER_SECURE') === 'true',
      testEmail: '',
    };
  }

  /**
   * Cancel action
   */
  cancel() {
    const emailParameters = this.getEmailParameters();
    this.emailModel.set(emailParameters);
  }

  /**
   * Update email parameters
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.emailForm, async () => {
        await firstValueFrom(
          this._parameterService
            .updateMultiple(this.getValueEmailForm())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success(
          'Los parámetros se actualizaron correctamente.',
          'Parámetros actualizados',
        );
        this.refreshParameters.emit(true);
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar los parámetros.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Test email
   */
  async testEmail(): Promise<void> {
    try {
      await submit(this.emailForm, async (field) => {
        await firstValueFrom(
          this._parameterService
            .testEmail(field().value().testEmail)
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this.emailModel.update((prev) => ({ ...prev, testEmail: '' }));
        this._toastrService.success(
          'Se ha enviado el correo electrónico, revisa tu bandeja de entrada o spam.',
          'Correo enviado',
        );
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible enviar el correo electrónico.',
        'Error enviar correo',
      );
    }
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
   * @param key
   * @returns
   */
  getObjectParameter(code: string, key: keyof EmailParameterFormI): ParameterI {
    const emailModel = this.emailModel();
    return {
      code,
      value: emailModel[key].toString(),
    };
  }

  /**
   * Change value of visibility of password
   */
  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }
}
