import { ChangeDetectorRef, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import {
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { AuthService } from 'app/core/services/auth.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { AuthComponent } from 'app/shared/components/auth/auth';
import { IpUtils } from 'app/shared/utils/ip.utils';
import { getLogo } from 'app/shared/utils/parameter.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'auth-unlock-session',
  templateUrl: './unlock-session.html',
  imports: [FormsModule, ReactiveFormsModule, RouterLink, AuthComponent],
  providers: [IpUtils],
})
export class AuthUnlockSession implements OnInit {
  @ViewChild('unlockSessionNgForm') unlockSessionNgForm!: NgForm;

  name!: string;
  unlockSessionForm!: UntypedFormGroup;
  passwordVisible = signal<boolean>(false);
  parameters = signal<ParameterI[]>([]);
  ip: string | undefined;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  private email!: string;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _ipUtils = inject(IpUtils);
  private _parameterService = inject(ParameterService);
  private _activatedRoute = inject(ActivatedRoute);
  private _authService = inject(AuthService);
  private _formBuilder = inject(UntypedFormBuilder);
  private _router = inject(Router);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _toastrService = inject(ToastrService);

  /**
   * Constructor
   */
  constructor() {
    this._activatedRoute.params.subscribe((params) => {
      this.email = params['email'];
      this.name = params['name'];
      if (this.email === undefined || this.name === undefined) {
        this._router.navigateByUrl('/auth/sign-in');
      }
    });

    this._parameterService.parameter$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((parameters: ParameterI[]) => {
        this.parameters.set(parameters);

        // Mark for check
        this._changeDetectorRef.markForCheck();
      });

    this._ipUtils.getClientIp().subscribe({
      next: (res) => {
        this.ip = res;
      },
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
    this.unlockSessionForm = this._formBuilder.group({
      name: [
        {
          value: this.name,
          disabled: true,
        },
      ],
      password: ['', Validators.required],
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Sign in
   */
  signIn(): void {
    // Return if the form is invalid
    if (this.unlockSessionForm.invalid) {
      return;
    }

    // Disable the form
    this.unlockSessionForm.disable();

    // Sign in
    this._authService
      .signIn(
        {
          email: this.email ?? '',
          password: this.unlockSessionForm.get('password')?.value,
        },
        this.ip!,
      )
      .subscribe({
        next: (response) => {
          if (!response.message.includes('código de verificación')) {
            // Store the access token in the local storage
            this._authService.accessToken = response.message;

            const redirectURL =
              this._activatedRoute.snapshot.queryParamMap.get('redirectURL') ||
              '/signed-in-redirect';

            // Navigate to the redirect url
            this._router.navigateByUrl(redirectURL);
          } else {
            // Navigate to the redirect url
            this._router.navigateByUrl('/auth/confirmation-required', {
              state: { email: this.email },
            });
          }
        },
        error: (err) => {
          // Re-enable the form
          this.unlockSessionForm.enable();
          // Reset the form
          this.unlockSessionNgForm.resetForm({
            name: {
              value: this.name,
              disabled: true,
            },
          });
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
   * Change value of visibility of password
   */
  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }
}
