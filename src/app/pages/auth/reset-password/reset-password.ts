import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { form, required, submit, pattern, FormField, validate } from '@angular/forms/signals';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { NgClass } from '@angular/common';
import { ParameterService, AuthService } from '@core/services';
import { CmsValidators, AuthUtils, getLogo, findParameter, hasErrorFormField } from '@shared/utils';
import { AuthComponent } from '@shared/components';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'auth-reset-password',
  templateUrl: './reset-password.html',
  imports: [RouterLink, AuthComponent, NgClass, FormField],
})
export class AuthResetPassword {
  longPwd = signal<number>(6);
  mayusPwd = signal<boolean>(false);
  specialPwd = signal<boolean>(false);
  numberPwd = signal<boolean>(false);
  passwordVisible = signal<boolean>(false);
  token = signal<string>('');
  evaluatePasswordSecurityResult = signal<{ score: number; strength: string }>({
    score: 0,
    strength: '',
  });
  passwordConfirmedVisible = signal<boolean>(false);
  resetPasswordModel = signal<{ passwordConfirm: string; password: string }>({
    password: '',
    passwordConfirm: '',
  });

  resetPasswordForm = form(this.resetPasswordModel, (schemaPath) => {
    required(schemaPath.password, { message: 'Nueva Contraseña es obligatorio.' });
    required(schemaPath.passwordConfirm, { message: 'Confirmar nueva contraseña es obligatorio.' });
    pattern(schemaPath.password, () => this.validatePassword(), {
      message: 'La nueva contraseña no cumple con los requisitos de seguridad.',
    });
    validate(schemaPath.passwordConfirm, (ctx) => {
      const password = ctx.valueOf(schemaPath.password);
      const confirmation = ctx.value();
      if (password !== confirmation) {
        return {
          kind: 'mismatch',
          message: 'Las contraseñas no coinciden',
        };
      }
      return null;
    });
  });

  mayusPwdRegex: RegExp = new RegExp('(?=.*[A-Z])');
  specialPwdRegex: RegExp = new RegExp('(?=.*[@#$%^&+=])');
  numberPwdRegex: RegExp = new RegExp('(?=.*\\d)');
  longPwdRegex: RegExp = new RegExp('.{' + this.longPwd() + ',}$');

  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;
  evaluatePasswordSecurity = CmsValidators.evaluatePasswordSecurity;

  private readonly _parameterService = inject(ParameterService);
  private readonly _authService = inject(AuthService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _router = inject(Router);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;
  readonly parameters = this._parameterService.publicParameters;

  /**
   * Constructor
   */
  constructor() {
    const token = this._activatedRoute.snapshot.queryParamMap.get('token') ?? '';
    if (!token) this._router.navigateByUrl('/auth/sign-in');
    if (AuthUtils.isTokenExpired(token)) this._router.navigateByUrl('/auth/sign-in');

    this.token.set(token);

    effect(() => {
      this.parameters();
      this.getParameters();
      this.longPwdRegex = new RegExp('.{' + this.longPwd() + ',}$');
    });

    toObservable(this.resetPasswordModel)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((res) => {
        this.evaluatePasswordSecurityResult.set(this.evaluatePasswordSecurity(res.password));
      });
  }

  /**
   * Reset password
   */
  async resetPassword(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.resetPasswordForm, async (field) => {
        const response = await firstValueFrom(
          this._authService
            .resetPassword(field().value().password, this.token())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success(response.message, 'Aviso');
        this._router.navigateByUrl('auth/sign-in');
      });
    } catch (err: any) {
      this._toastrService.error(
        err?.error?.message ?? 'Ocurrió un error al restablecer contraseña.',
        'Aviso',
      );
    }
  }

  /**
   * Get value of auth background
   * @returns
   */
  getLogo(): string {
    if (this.parameters().length > 0) return getLogo('LOGO_PRIMARY', this.parameters());
    return '';
  }

  /**
   * Get value of parameters PWD
   */
  getParameters() {
    this.longPwd.set(Number(findParameter('APP_PWD_LONG', this.parameters())?.value));
    this.mayusPwd.set(findParameter('APP_PWD_MAYUS', this.parameters())?.value === 'true');
    this.specialPwd.set(findParameter('APP_PWD_SPECIAL', this.parameters())?.value === 'true');
    this.numberPwd.set(findParameter('APP_PWD_NUMBER', this.parameters())?.value === 'true');
  }

  /**
   * Build pattern to PWD
   * @returns
   */
  validatePassword(): RegExp {
    let regex = '^';
    if (this.mayusPwd()) regex += '(?=.*[A-Z])';
    if (this.specialPwd()) regex += '(?=.*[@#$%^&+=])';
    if (this.numberPwd()) regex += '(?=.*\\d)';
    regex += '.{' + this.longPwd() + ',}$';

    return new RegExp(regex);
  }

  /**
   * Change value of visibility of password
   */
  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }

  /**
   * Change value of visibility of password confirmed
   */
  togglePasswordConfirmedVisibility(): void {
    this.passwordConfirmedVisible.set(!this.passwordConfirmedVisible());
  }

  /**
   * Validate RegExp
   * @param value
   * @param regex
   * @returns
   */
  validateRegex(value: string, regex: RegExp) {
    return regex.test(value);
  }
}
