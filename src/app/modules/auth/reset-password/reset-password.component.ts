import {
    ChangeDetectorRef,
    Component,
    OnInit,
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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { FuseValidators } from '@fuse/validators';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { AuthComponent } from 'app/shared/components/auth/auth.component';
import { findParameter, getLogo } from 'app/shared/utils/parameter.utils';
import { Subject, finalize, takeUntil } from 'rxjs';

@Component({
    selector: 'auth-reset-password',
    templateUrl: './reset-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterLink,
        AuthComponent,
    ],
})
export class AuthResetPasswordComponent implements OnInit {
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    resetPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;
    parameters = signal<ParameterI[]>([]);
    token: string;
    longPwd: number | undefined;
    mayusPwd: boolean | undefined;
    specialPwd: boolean | undefined;
    numberPwd: boolean | undefined;
    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this.token = this._activatedRoute.snapshot.queryParamMap.get('token');
        if (this.token === undefined)
            this._router.navigateByUrl('/auth/sign-in');
        if (AuthUtils.isTokenExpired(this.token)) {
            this._router.navigateByUrl('/auth/sign-in');
        }
        this._parameterService.parameter$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((parameters: ParameterI[]) => {
                this.parameters.set(parameters);

                // Mark for check
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
        this.resetPasswordForm = this._formBuilder.group(
            {
                password: ['', Validators.required],
                passwordConfirm: ['', Validators.required],
            },
            {
                validators: FuseValidators.mustMatch(
                    'password',
                    'passwordConfirm'
                ),
            }
        );

        this.getParameters();
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
            return;
        }

        // Disable the form
        this.resetPasswordForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Send the request to the server
        this._authService
            .resetPassword(
                this.resetPasswordForm.get('password').value,
                this.token
            )
            .pipe(
                finalize(() => {
                    // Re-enable the form
                    this.resetPasswordForm.enable();

                    // Reset the form
                    this.resetPasswordNgForm.resetForm();

                    // Show the alert
                    this.showAlert = true;
                })
            )
            .subscribe({
                next: (response) => {
                    // Set the alert
                    this.alert = {
                        type: 'success',
                        message: response.message,
                    };
                },
                error: (response) => {
                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: response.error.message,
                    };
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
        this.longPwd = Number(
            findParameter('APP_PWD_LONG', this.parameters()).value
        );
        this.mayusPwd =
            findParameter('APP_PWD_MAYUS', this.parameters()).value === 'true';
        this.specialPwd =
            findParameter('APP_PWD_SPECIAL', this.parameters()).value ===
            'true';
        this.numberPwd =
            findParameter('APP_PWD_NUMBER', this.parameters()).value === 'true';

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
        if (this.mayusPwd) regex += '(?=.*[A-Z])';
        if (this.specialPwd) regex += '(?=.*[@#$%^&+=])';
        if (this.numberPwd) regex += '(?=.*\\d)';
        regex += '.{' + this.longPwd + ',}$';
        return new RegExp(regex);
    }
}
