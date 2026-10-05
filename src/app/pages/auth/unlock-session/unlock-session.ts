import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { form, required, email, submit, FormField, disabled } from '@angular/forms/signals';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterService, AuthService } from '@core/services';
import { IpUtils, getLogo, hasErrorFormField } from '@shared/utils';
import { AuthComponent } from '@shared/components';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'auth-unlock-session',
  templateUrl: './unlock-session.html',
  imports: [RouterLink, AuthComponent, FormField, NgClass],
  providers: [IpUtils],
})
export class AuthUnlockSession {
  passwordVisible = signal<boolean>(false);
  unlockSessionModel = signal<{ name: string; password: string; email: string }>({
    name: '',
    password: '',
    email: '',
  });

  unlockSessionForm = form(this.unlockSessionModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Dirección de correo electrónico es obligatorio.' });
    email(schemaPath.email, { message: 'Dirección de correo electrónico no válido.' });
    required(schemaPath.name, { message: 'Nombre es obligatorio.' });
    required(schemaPath.password, { message: 'Contraseña es obligatorio.' });
    disabled(schemaPath.name);
  });

  private readonly _parameterService = inject(ParameterService);
  private readonly _authService = inject(AuthService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _ipUtils = inject(IpUtils);
  private readonly _router = inject(Router);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;
  readonly parameters = this._parameterService.publicParameters;
  readonly ip = toSignal(this._ipUtils.getClientIp(), { initialValue: '' });
  readonly params = toSignal(this._activatedRoute.params);

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const params = this.params();
      if (!params) return;

      const { name, email } = params as any;
      if (!email || !name) this._router.navigateByUrl('/auth/sign-in');

      this.unlockSessionModel.update((prev) => ({ ...prev, name, email }));
    });
  }

  /**
   * Sign in
   */
  async signIn(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.unlockSessionForm, async (field) => {
        const response = await firstValueFrom(
          this._authService
            .signIn(field().value(), this.ip())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );

        if (response.message.includes('código de verificación')) {
          await this._router.navigateByUrl('/auth/confirmation-required', {
            state: {
              email: field().value().email,
            },
          });
          return;
        }
        this._authService.accessToken = response.message;
        const redirectURL =
          this._activatedRoute.snapshot.queryParamMap.get('redirectURL') ?? '/signed-in-redirect';
        await this._router.navigateByUrl(redirectURL);
      });
    } catch (err: any) {
      this._toastrService.error(
        err?.error?.message ?? 'Ocurrió un error al iniciar sesión.',
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

  /**
   * Change value of visibility of password
   */
  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }
}
