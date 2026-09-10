import {
  ChangeDetectorRef,
  Component,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import {
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { AuthService } from 'app/core/services/auth.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { AuthComponent } from 'app/shared/components/auth/auth';
import { OtpComponent } from 'app/shared/components/otp/otp';
import { IpUtils } from 'app/shared/utils/ip.utils';
import { findParameter, getLogo } from 'app/shared/utils/parameter.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { finalize, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';

@Component({
  selector: 'auth-confirmation-required',
  templateUrl: './confirmation-required.html',
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink, ReactiveFormsModule, FormsModule, AuthComponent, OtpComponent],
  providers: [IpUtils],
})
export class AuthConfirmationRequired {
  @ViewChild('signInNgForm') signInNgForm!: NgForm;
  @ViewChild('OtpComponent') otpComponent!: OtpComponent;

  signInForm!: UntypedFormGroup;
  parameters = signal<ParameterI[]>([]);
  countdown = signal<number>(300);
  countdownMapping: any = {
    '=1': '# second',
    other: '# seconds',
  };
  email: string;
  ip: string | undefined;
  resendOtp = signal<boolean>(false);
  getErrorMessage = CmsValidators.getErrorMessage;
  validateFormControl = CmsValidators.validateFormControl;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _ipUtils = inject(IpUtils);
  private readonly _authService = inject(AuthService);
  private readonly _router = inject(Router);
  private readonly _parameterService = inject(ParameterService);
  private readonly _formBuilder = inject(UntypedFormBuilder);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);
  private readonly _toastrService = inject(ToastrService);

  /**
   * Constructor
   */
  constructor() {
    this.email = this._router.currentNavigation()?.extras?.state?.['email'];
    if (this.email === undefined) this._router.navigateByUrl('/auth/sign-in');

    this._parameterService.parameter$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((parameters: ParameterI[]) => {
        this.parameters.set(parameters);
        this.countdown.set(
          Number(findParameter('OTP_TIME_RESEND', this.parameters())?.value ?? 300),
        );
        this._changeDetectorRef.markForCheck();
      });

    this._ipUtils.getClientIp().subscribe({
      next: (res) => {
        this.ip = res;
      },
    });
  }

  /**
   * On init
   */
  ngOnInit(): void {
    // Create the form
    this.signInForm = this._formBuilder.group({
      email: [this.email, [Validators.required, Validators.email]],
      otp: ['', Validators.required],
    });

    this.timerOtp();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -

  /**
   * Timer tom resendOtp
   */
  timerOtp() {
    // Redirect after the countdown
    timer(1000, 1000)
      .pipe(
        finalize(() => {
          this.resendOtp.set(true);
        }),
        takeWhile(() => this.countdown() > 0),
        takeUntil(this._unsubscribeAll),
        tap(() => this.countdown.update((value) => value - 1)),
      )
      .subscribe();
  }

  /**
   * Sign in
   */
  signIn(): void {
    // Return if the form is invalid
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.signInForm.disable();

    // Sign in
    this._authService.twoFactorAuth(this.signInForm.value, this.ip!).subscribe({
      next: (response) => {
        // Store the access token in the local storage
        this._authService.accessToken = response.message;

        const redirectURL =
          this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

        // Navigate to the redirect url
        this._router.navigateByUrl(redirectURL);
      },
      error: (err) => {
        // Re-enable the form
        this.signInForm.enable();
        // Reset the form
        this.signInNgForm.resetForm();
        this.otpComponent.clear();
        this.signInForm.get('email')?.setValue(this.email);
        // Set the alert
        this._toastrService.error(err.error.message, 'Aviso');
      },
    });
  }

  /**
   * Set value to form
   * @param otp
   */
  onOtpChange(otp: string) {
    this.signInForm.get('otp')?.setValue(otp);
  }

  /**
   * Get value of auth background
   * @returns
   */
  getLogo() {
    if (this.parameters().length > 0) {
      return getLogo('LOGO_PRIMARY', this.parameters());
    } else {
      return '';
    }
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
  resendOtpCode() {
    this.signInForm.disable();

    const { email } = this.signInForm.value;

    this._authService
      .resendOtp(email)
      .pipe(
        finalize(() => {
          this.signInForm.enable();
          this.signInForm.reset();
          this.signInForm.get('email')?.setValue(email);
        }),
      )
      .subscribe({
        next: (response) => {
          this.resendOtp.set(false);
          this.countdown.set(
            Number(findParameter('OTP_TIME_RESEND', this.parameters())?.value ?? 300),
          );
          this.timerOtp();
          this._toastrService.success(response.message, 'Aviso');
        },
        error: (err) => {
          this._toastrService.error(err.error.message, 'Aviso');
        },
      });
  }
}
