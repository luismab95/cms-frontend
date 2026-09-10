import { ChangeDetectorRef, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import {
  FormControl,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { NgLabelTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { AuthService } from 'app/core/services/auth.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { AuthComponent } from 'app/shared/components/auth/auth';
import { IpUtils } from 'app/shared/utils/ip.utils';
import { getLogo } from 'app/shared/utils/parameter.utils';
import { LanguageService } from 'app/shared/services/language.service';
import { LanguageI } from 'app/shared/interfaces/language.interfaces';
import { Subject, takeUntil } from 'rxjs';
import { PaginationResponseI } from 'app/shared/interfaces/response.interface';
import { CmsValidators } from 'app/shared/utils/validators.util';

@Component({
  selector: 'sign-in',
  templateUrl: './sign-in.html',
  imports: [
    AuthComponent,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    NgSelectComponent,
    NgLabelTemplateDirective,
  ],
  providers: [IpUtils],
})
export class AuthSignIn implements OnInit {
  @ViewChild('signInNgForm') signInNgForm!: NgForm;

  signInForm!: UntypedFormGroup;
  ip: string | undefined;
  passwordVisible = signal<boolean>(false);
  parameters = signal<ParameterI[]>([]);
  languages = signal<LanguageI[]>([]);
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  readonly selectedLanguage = new FormControl<string | null>(null);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _parameterService = inject(ParameterService);
  private readonly _authService = inject(AuthService);
  private readonly _ipUtils = inject(IpUtils);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _formBuilder = inject(UntypedFormBuilder);
  private readonly _router = inject(Router);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);
  private readonly _toastrService = inject(ToastrService);
  private readonly _languageService = inject(LanguageService);

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

    this._languageService.languages$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: PaginationResponseI<LanguageI[]>) => {
        this.languages.set(response.records);
        this.selectedLanguage.setValue(this.languages()[0].lang);
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
    this.signInForm = this._formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
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
    if (this.signInForm.invalid) {
      this.signInForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.signInForm.disable();

    // Sign in
    this._authService.signIn(this.signInForm.value, this.ip!).subscribe({
      next: (response) => {
        if (!response.message.includes('código de verificación')) {
          // Store the access token in the local storage
          this._authService.accessToken = response.message;
          const redirectURL =
            this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';

          // Navigate to the redirect url
          this._router.navigateByUrl(redirectURL);
        } else {
          // Navigate to the redirect url
          this._router.navigateByUrl('/auth/confirmation-required', {
            state: { email: this.signInForm.value.email },
          });
        }
      },
      error: (err) => {
        // Re-enable the form
        this.signInForm.enable();
        // Reset the form
        this.signInNgForm.resetForm();
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
