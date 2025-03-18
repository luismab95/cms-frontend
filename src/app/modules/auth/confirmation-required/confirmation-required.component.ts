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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { AuthComponent } from 'app/shared/components/auth/auth.component';
import { OtpComponent } from 'app/shared/components/otp/otp.component';
import { IpUtils } from 'app/shared/utils/ip.utils';
import { getLogo } from 'app/shared/utils/parameter.utils';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'auth-confirmation-required',
    templateUrl: './confirmation-required.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        RouterLink,
        AuthComponent,
        MatButtonModule,
        MatFormFieldModule,
        ReactiveFormsModule,
        FormsModule,
        MatInputModule,
        MatProgressSpinnerModule,
        FuseAlertComponent,
        OtpComponent,
    ],
    providers: [IpUtils],
})
export class AuthConfirmationRequiredComponent {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    parameters = signal<ParameterI[]>([]);
    email: string;
    ip: string | undefined;
    private _parameterService = inject(ParameterService);
    private _ipUtils = inject(IpUtils);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _authService: AuthService,
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this.email = this._router.getCurrentNavigation()?.extras?.state?.email;
        if (this.email === undefined)
            this._router.navigateByUrl('/auth/sign-in');
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

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.signInForm = this._formBuilder.group({
            email: [this.email, [Validators.required, Validators.email]],
            otp: ['', Validators.required],
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -

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

        // Hide the alert
        this.showAlert = false;

        // Sign in
        // Sign in
        this._authService
            .twoFactorAuth(this.signInForm.value, this.ip)
            .subscribe({
                next: (response) => {
                    // Store the access token in the local storage
                    this._authService.accessToken = response.message;

                    const redirectURL =
                        this._activatedRoute.snapshot.queryParamMap.get(
                            'redirectURL'
                        ) || '/signed-in-redirect';

                    // Navigate to the redirect url
                    this._router.navigateByUrl(redirectURL);
                },
                error: (response) => {
                    // Re-enable the form
                    this.signInForm.enable();
                    // Reset the form
                    this.signInNgForm.resetForm();
                    this.signInForm.get('email').setValue(this.email);
                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: response.error.message,
                    };
                    // Show the alert
                    this.showAlert = true;
                },
            });
    }

    /**
     * Set value to form
     * @param otp
     */
    onOtpChange(otp: string) {
        this.signInForm.get('otp').setValue(otp);
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
