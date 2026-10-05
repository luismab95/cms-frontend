import { Component, DestroyRef, inject, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterService, AuthService } from '@core/services';
import { AuthComponent } from '@shared/components';
import { getLogo, hasErrorFormField } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'auth-forgot-password',
  templateUrl: './forgot-password.html',
  imports: [RouterLink, AuthComponent, FormField, NgClass],
})
export class AuthForgotPassword {
  forgotPasswordModel = signal<{ email: string }>({
    email: '',
  });

  forgotPasswordForm = form(this.forgotPasswordModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Dirección de correo electrónico es obligatorio.' });
    email(schemaPath.email, { message: 'Dirección de correo electrónico no válido.' });
  });

  private readonly _parameterService = inject(ParameterService);
  private readonly _authService = inject(AuthService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;
  readonly parameters = this._parameterService.publicParameters;

  /**
   * Send the reset link
   */
  async sendResetLink(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.forgotPasswordForm, async (field) => {
        const response = await firstValueFrom(
          this._authService
            .forgotPassword(field().value().email)
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success(response.message, 'Aviso');
        this._router.navigateByUrl('/auth/sign-in');
      });
    } catch (err: any) {
      this._toastrService.error(
        err?.error?.message ??
          'Ocurrió un error al enviar correo de restablecimiento de contraseña.',
        'Aviso',
      );
    }
  }

  /**
   * Get value of auth background
   * @returns
   */
  getLogo() {
    if (this.parameters().length > 0) return getLogo('LOGO_PRIMARY', this.parameters());
    return '';
  }
}
