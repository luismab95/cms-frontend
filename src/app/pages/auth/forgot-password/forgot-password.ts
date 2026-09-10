import { ChangeDetectorRef, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import {
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { AuthService } from 'app/core/services/auth.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { AuthComponent } from 'app/shared/components/auth/auth';
import { getLogo } from 'app/shared/utils/parameter.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'auth-forgot-password',
  templateUrl: './forgot-password.html',
  imports: [FormsModule, ReactiveFormsModule, RouterLink, AuthComponent],
})
export class AuthForgotPassword implements OnInit {
  @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm!: NgForm;

  forgotPasswordForm!: UntypedFormGroup;
  parameters = signal<ParameterI[]>([]);
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _parameterService = inject(ParameterService);
  private _authService = inject(AuthService);
  private _formBuilder = inject(UntypedFormBuilder);
  private _toastrService = inject(ToastrService);
  private _changeDetectorRef = inject(ChangeDetectorRef);

  /**
   * Constructor
   */
  constructor() {
    this._parameterService.parameter$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((parameters: ParameterI[]) => {
        this.parameters.set(parameters);
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
    // Create the form
    this.forgotPasswordForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Send the reset link
   */
  sendResetLink(): void {
    // Return if the form is invalid
    if (this.forgotPasswordForm.invalid) {
      return;
    }

    // Disable the form
    this.forgotPasswordForm.disable();

    // Forgot password
    this._authService
      .forgotPassword(this.forgotPasswordForm.get('email')?.value)
      .pipe(
        finalize(() => {
          // Re-enable the form
          this.forgotPasswordForm.enable();
          // Reset the form
          this.forgotPasswordNgForm.resetForm();
        }),
      )
      .subscribe({
        next: (response) => {
          this._toastrService.success(response.message, 'Aviso');
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
}
