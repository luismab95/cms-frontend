import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { form, FormField, pattern, required, submit } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgLabelTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterI, SecurityParameterFormI } from '@core/interfaces';
import { ParameterService } from '@core/services';
import { findParameter, hasErrorFormField } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'parameters-security',
  templateUrl: './security.html',
  imports: [NgSelectComponent, NgLabelTemplateDirective, FormField, NgClass],
})
export class ParametersSecurityComponent {
  parameters = input.required<ParameterI[]>();
  edit = input.required<boolean>();
  refreshParameters = output<boolean>();

  securityModel = signal<SecurityParameterFormI>({
    inactivity: '',
    attemps: '',
    pwdLong: '',
    optTime: '',
    otpLong: '',
    otpType: '',
    pwdNumber: false,
    pwdMayus: false,
    pwdSpecial: false,
  });

  securityForm = form(this.securityModel, (schemaPath) => {
    required(schemaPath.inactivity, {
      message: 'Tiempo cierre de sesión por inactividad es obligatorio.',
    });
    required(schemaPath.attemps, {
      message: 'Números de intentos para inicio de sesión es obligatorio.',
    });
    required(schemaPath.pwdLong, { message: 'Longitud mínima de contraseñas es obligatorio.' });
    required(schemaPath.optTime, {
      message: 'Tiempo para validar reenvío de código OTP es obligatorio.',
    });
    required(schemaPath.otpLong, {
      message: 'Longitud de código de verificación OTP es obligatorio.',
    });
    required(schemaPath.otpType, { message: 'Tipo de caracteres es obligatorio.' });
    pattern(schemaPath.inactivity, /^-?[0-9]+$/, {
      message: 'Tiempo cierre de sesión por inactividad no válido.',
    });
    pattern(schemaPath.attemps, /^-?[0-9]+$/, {
      message: 'Números de intentos para inicio de sesión no válido.',
    });
    pattern(schemaPath.pwdLong, /^-?[0-9]+$/, {
      message: 'Longitud mínima de contraseñas no válido.',
    });
    pattern(schemaPath.optTime, /^-?[0-9]+$/, {
      message: 'Tiempo para validar reenvío de código OTP no válido.',
    });
    pattern(schemaPath.otpLong, /^-?[0-9]+$/, {
      message: 'Longitud de código de verificación OTP no válido.',
    });
  });

  private readonly _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      this.parameters();
      const securityParameters = this.getSecurityParameters();
      this.securityModel.set(securityParameters);
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
    const securityParameters = this.getSecurityParameters();
    this.securityModel.set(securityParameters);
  }

  /**
   * Update email parameters
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.securityForm, async () => {
        await firstValueFrom(
          this._parameterService
            .updateMultiple(this.getValueSecurityForm())
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
   * @param key
   * @returns
   */
  getObjectParameter(code: string, key: keyof SecurityParameterFormI): ParameterI {
    const securityModel = this.securityModel();
    return {
      code,
      value: securityModel[key].toString(),
    };
  }
}
