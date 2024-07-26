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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { AuthComponent } from 'app/shared/components/auth/auth.component';
import { IpUtils } from 'app/shared/utils/ip.utils';
import { getLogo } from 'app/shared/utils/parameter.utils';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'sign-in-fullscreen-reversed',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        RouterLink,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        AuthComponent,
    ],
    providers: [IpUtils],
})
export class SignInFullscreenReversedComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    ip: string | undefined;
    parameters = signal<ParameterI[]>([]);
    private _parameterService = inject(ParameterService);
    private _ipUtils = inject(IpUtils);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
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
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign in
        this._authService.signIn(this.signInForm.value, this.ip).subscribe({
            next: (response) => {
                if (!response.message.includes('código de verificación')) {
                    // Store the access token in the local storage
                    this._authService.accessToken = response.message;

                    const redirectURL =
                        this._activatedRoute.snapshot.queryParamMap.get(
                            'redirectURL'
                        ) || '/signed-in-redirect';

                    // Navigate to the redirect url
                    this._router.navigateByUrl(redirectURL);
                } else {
                    // Navigate to the redirect url
                    this._router.navigateByUrl('/auth/confirmation-required', {
                        state: { email: this.signInForm.value.email },
                    });
                }
            },
            error: (response) => {
                // Re-enable the form
                this.signInForm.enable();
                // Reset the form
                this.signInNgForm.resetForm();
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
