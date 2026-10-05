import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { email, form, required, submit } from '@angular/forms/signals';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { IpUtils, findParameter, getLogo, hasErrorFormField } from '@shared/utils';
import { AuthComponent, OtpComponent } from '@shared/components';
import { AuthService, ParameterService } from '@core/services';
import { finalize, firstValueFrom, takeWhile, tap, timer } from 'rxjs';

@Component({
  selector: 'auth-confirmation-required',
  templateUrl: './confirmation-required.html',
  imports: [RouterLink, AuthComponent, OtpComponent],
  providers: [IpUtils],
})
export class AuthConfirmationRequired {
  countdown = signal<number>(300);
  resendOtp = signal<boolean>(false);
  signInModel = signal<{ email: string; otp: string }>({
    email: '',
    otp: '',
  });

  signInForm = form(this.signInModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Dirección de correo electrónico es obligatorio.' });
    email(schemaPath.email, { message: 'Dirección de correo electrónico no válido.' });
    required(schemaPath.otp, { message: 'Código de verificación es obligatorio.' });
  });

  countdownMapping = {
    '=1': '# second',
    other: '# seconds',
  };

  private readonly _authService = inject(AuthService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _router = inject(Router);
  private readonly _ipUtils = inject(IpUtils);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;
  readonly parameters = this._parameterService.publicParameters;
  readonly ip = toSignal(this._ipUtils.getClientIp(), { initialValue: '' });

  /**
   * Constructor
   */
  constructor() {
    const email = this._router.currentNavigation()?.extras?.state?.['email'];
    if (!email) this._router.navigateByUrl('/auth/sign-in');

    this.signInModel.update((prev) => ({ ...prev, email }));

    effect(() => {
      this.parameters();
      this.countdown.set(Number(findParameter('OTP_TIME_RESEND', this.parameters())?.value ?? 300));
    });

    this.timerOtp();
  }

  /**
   * Timer tom resendOtp
   */
  timerOtp() {
    timer(1000, 1000)
      .pipe(
        finalize(() => {
          this.resendOtp.set(true);
        }),
        takeWhile(() => this.countdown() > 0),
        takeUntilDestroyed(this._destroyRef),
        tap(() => this.countdown.update((value) => value - 1)),
      )
      .subscribe();
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
            .twoFactorAuth(field().value(), this.ip())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );

        this._authService.accessToken = response.message;
        const redirectURL =
          this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
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
   * Set value to form
   * @param otp
   */
  onOtpChange(otp: string) {
    this.signInModel.update((prev) => ({ ...prev, otp }));
    this.signInForm().markAsTouched();
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
   * Format seconds to 00:00
   * @param seconds
   * @returns
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const restantSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${restantSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Send a new code OTP
   */
  async resendOtpCode(): Promise<void> {
    try {
      await submit(this.signInForm, async (field) => {
        const response = await firstValueFrom(
          this._authService
            .resendOtp(field().value().email)
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this.resendOtp.set(false);
        this.countdown.set(
          Number(findParameter('OTP_TIME_RESEND', this.parameters())?.value ?? 300),
        );
        this.timerOtp();
        this._toastrService.success(response.message, 'Aviso');
      });
    } catch (err: any) {
      this._toastrService.error(
        err?.error?.message ?? 'Ocurrió un error al reenviar código de verificación.',
        'Aviso',
      );
    }
  }
}
