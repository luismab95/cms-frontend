import { NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
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
import { AuthUtils } from 'app/shared/utils/auth.utils';
import { findParameter, getLogo } from 'app/shared/utils/parameter.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'auth-reset-password',
  templateUrl: './reset-password.html',
  imports: [FormsModule, ReactiveFormsModule, RouterLink, AuthComponent, NgClass],
})
export class AuthResetPassword implements OnInit {
  @ViewChild('resetPasswordNgForm') resetPasswordNgForm!: NgForm;

  resetPasswordForm!: UntypedFormGroup;
  parameters = signal<ParameterI[]>([]);
  token: string;
  longPwd = signal<number>(6);
  mayusPwd = signal<boolean>(false);
  specialPwd = signal<boolean>(false);
  numberPwd = signal<boolean>(false);
  passwordVisible = signal<boolean>(false);
  evaluatePasswordSecurityResult = signal<{ score: number; strength: string }>({
    score: 0,
    strength: '',
  });
  passwordConfirmedVisible = signal<boolean>(false);
  mayusPwdRegex: RegExp = new RegExp('(?=.*[A-Z])');
  specialPwdRegex: RegExp = new RegExp('(?=.*[@#$%^&+=])');
  numberPwdRegex: RegExp = new RegExp('(?=.*\\d)');
  longPwdRegex: RegExp = new RegExp('.{' + this.longPwd() + ',}$');

  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;
  evaluatePasswordSecurity = CmsValidators.evaluatePasswordSecurity;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _parameterService = inject(ParameterService);
  private _authService = inject(AuthService);
  private _formBuilder = inject(UntypedFormBuilder);
  private _router = inject(Router);
  private _activatedRoute = inject(ActivatedRoute);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _toastrService = inject(ToastrService);

  /**
   * Constructor
   */
  constructor() {
    this.token = this._activatedRoute.snapshot.queryParamMap.get('token') ?? '';
    if (this.token === undefined) this._router.navigateByUrl('/auth/sign-in');
    if (AuthUtils.isTokenExpired(this.token)) {
      this._router.navigateByUrl('/auth/sign-in');
    }

    // Create the form
    this.resetPasswordForm = this._formBuilder.group(
      {
        password: ['', Validators.required],
        passwordConfirm: ['', Validators.required],
      },
      {
        validators: CmsValidators.mustMatch('password', 'passwordConfirm'),
      },
    );

    this._parameterService.parameter$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((parameters: ParameterI[]) => {
        this.parameters.set(parameters);
        this.getParameters();
        this.longPwdRegex = new RegExp('.{' + this.longPwd() + ',}$');
        this._changeDetectorRef.markForCheck();
      });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    this.resetPasswordForm.valueChanges.subscribe((res) => {
      this.evaluatePasswordSecurityResult.set(this.evaluatePasswordSecurity(res.password));
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Reset password
   */
  resetPassword(): void {
    // Return if the form is invalid
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.resetPasswordForm.disable();

    // Send the request to the server
    this._authService
      .resetPassword(this.resetPasswordForm.get('password')?.value, this.token)
      .pipe(
        finalize(() => {
          // Re-enable the form
          this.resetPasswordForm.enable();

          // Reset the form
          this.resetPasswordNgForm.resetForm();
        }),
      )
      .subscribe({
        next: (response) => {
          // Set the alert
          this._toastrService.success(response.message, 'Aviso');

          setTimeout(() => {
            this._router.navigateByUrl('auth/sign-in');
          }, 300);
        },
        error: (err) => {
          // Set the alert
          this._toastrService.error(err.error.message, 'Aviso');
        },
      });
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
   * Get value of parameters PWD
   */
  getParameters() {
    this.longPwd.set(Number(findParameter('APP_PWD_LONG', this.parameters())?.value));
    this.mayusPwd.set(findParameter('APP_PWD_MAYUS', this.parameters())?.value === 'true');
    this.specialPwd.set(findParameter('APP_PWD_SPECIAL', this.parameters())?.value === 'true');
    this.numberPwd.set(findParameter('APP_PWD_NUMBER', this.parameters())?.value === 'true');
    this.setParameters();
  }

  /**
   * Set value to parameters PWD
   */
  setParameters() {
    this.resetPasswordForm
      .get('password')
      ?.addValidators(Validators.pattern(this.validatePassword()));
    this.resetPasswordForm.updateValueAndValidity();
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

    console.log(regex);
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
