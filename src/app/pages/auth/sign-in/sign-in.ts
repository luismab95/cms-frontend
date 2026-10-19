import { Component, signal, inject, DestroyRef, effect } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NgClass, UpperCasePipe } from '@angular/common';
import {
  NgSelectComponent,
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
} from '@ng-select/ng-select';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { AuthService, ParameterService } from '@core/services';
import { IpUtils, getLogo, hasErrorFormField } from '@shared/utils';
import { LanguageService } from '@shared/services';
import { AuthComponent } from '@shared/components';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'sign-in',
  templateUrl: './sign-in.html',
  imports: [
    AuthComponent,
    FormField,
    RouterLink,
    NgSelectComponent,
    NgLabelTemplateDirective,
    NgOptionTemplateDirective,
    NgClass,
    UpperCasePipe,
  ],
  providers: [IpUtils],
})
export class AuthSignIn {
  passwordVisible = signal<boolean>(false);
  signInModel = signal<{ email: string; password: string; selectedLanguage: string }>({
    email: '',
    password: '',
    selectedLanguage: 'es',
  });

  signInForm = form(this.signInModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Dirección de correo electrónico es obligatorio.' });
    email(schemaPath.email, { message: 'Dirección de correo electrónico no válido.' });
    required(schemaPath.password, { message: 'Contraseña es obligatorio.' });
  });

  private readonly _authService = inject(AuthService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _languageService = inject(LanguageService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _ipUtils = inject(IpUtils);

  readonly hasError = hasErrorFormField;
  readonly parameters = this._parameterService.publicParameters;
  readonly languages = this._languageService.languages;

  readonly ip = toSignal(this._ipUtils.getClientIp(), { initialValue: '' });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const languages = this.languages().records;
      this.signInModel.update((prev) => ({ ...prev, selectedLanguage: languages[0].lang }));
    });
  }

  /**
   * Sign in
   */
  async signIn(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.signInForm, async (field) => {
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
  getLogo(): string {
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
