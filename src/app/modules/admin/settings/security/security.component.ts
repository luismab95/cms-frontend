import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnInit,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import {
    FormsModule,
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { fuseAnimations } from '@fuse/animations';
import { UserService } from 'app/core/user/user.service';
import { UserI } from 'app/core/user/user.types';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { Subject, takeUntil } from 'rxjs';
import { ParameterI } from '../../parameters/parameter.interface';
import { ParameterService } from '../../parameters/parameter.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'settings-security',
    templateUrl: './security.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSlideToggleModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
})
export class SettingsSecurityComponent implements OnInit {
    @Input() user: UserI;
    securityForm: UntypedFormGroup;
    parameters = signal<ParameterI[]>([]);
    longPwd: number | undefined;
    mayusPwd: boolean | undefined;
    specialPwd: boolean | undefined;
    numberPwd: boolean | undefined;
    private _userService = inject(UserService);
    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private _toastrService: ToastrService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this._parameterService.parameter$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((parameters: ParameterI[]) => {
                this.parameters.set(parameters);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Create the form
        this.securityForm = this._formBuilder.group({
            firstname: ['', Validators.required],
            lastname: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: [''],
            twoFactorAuth: [true],
        });

        this.securityForm.patchValue({ ...this.user });

        this.getParameters();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

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
        this.securityForm
            .get('password')
            ?.addValidators(Validators.pattern(this.validatePassword()));
        this.securityForm.updateValueAndValidity();
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

    /**
     * Save action
     */
    save() {
        // Return if the form is invalid
        if (this.securityForm.invalid) {
            return;
        }

        // Disable the form
        this.securityForm.disable();

        if (this.securityForm.value.password === '') {
            delete this.securityForm.value.password;
        }

        this._userService
            .update(this.user.id, this.securityForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.securityForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );
                },
                error: (response) => {
                    // Re-enable the form
                    this.securityForm.enable();
                    // Reset the form
                    this.securityForm.reset();
                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Cancel action
     */
    cancel() {
        this.securityForm.reset();
        this.securityForm.patchValue({ ...this.user });
    }
}
