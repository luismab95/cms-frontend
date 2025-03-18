import { TextFieldModule } from '@angular/cdk/text-field';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewEncapsulation,
    inject,
} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { ParameterI } from '../parameter.interface';
import { ParameterService } from '../parameter.service';

@Component({
    selector: 'parameters-security',
    templateUrl: './security.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        TextFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatButtonModule,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
    ],
})
export class ParametersSecurityComponent implements OnInit {
    @Input() parameters: ParameterI[] = [];
    @Output() refreshParameters: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    securityForm: UntypedFormGroup;

    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _toastrService: ToastrService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.securityForm = this._formBuilder.group({
            inactivity: [
                '',
                [Validators.required, Validators.pattern('^-?[0-9]+$')],
            ],
            attemps: [
                '',
                [Validators.required, Validators.pattern('^-?[0-9]+$')],
            ],
            pwdLong: [
                '',
                [Validators.required, Validators.pattern('^-?[0-9]+$')],
            ],
            pwdNumber: [],
            pwdMayus: [],
            pwdSpecial: [],
            otpLong: [
                '',
                [Validators.required, Validators.pattern('^-?[0-9]+$')],
            ],
            otpType: ['', Validators.required],
        });

        this.securityForm.patchValue({ ...this.getSecurityParameters() });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get parameter
     * @param code
     */
    getParameter(code: string) {
        if (this.parameters.length > 0) {
            return findParameter(code, this.parameters).value;
        }
    }

    /**
     * Get parameters
     * @returns
     */
    getSecurityParameters() {
        return {
            otpType: this.getParameter('OTP_TYPE'),
            otpLong: this.getParameter('OTP_LONG'),
            attemps: this.getParameter('APP_ATTEMPS_LOGIN'),
            inactivity: this.getParameter('APP_INACTIVITY'),
            pwdLong: this.getParameter('APP_PWD_LONG'),
            pwdSpecial: this.getParameter('APP_PWD_SPECIAL') === 'true',
            pwdMayus: this.getParameter('APP_PWD_MAYUS') === 'true',
            pwdNumber: this.getParameter('APP_PWD_NUMBER') === 'true',
        };
    }

    /**
     * Cancel action
     */
    cancel() {
        this.securityForm.reset();
        this.securityForm.patchValue({ ...this.getSecurityParameters() });
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

        this._parameterService
            .updateMultiple(this.getValueSecurityForm())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.securityForm.enable();

                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');

                    // Emit refresh parameters
                    this.refreshParameters.emit(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.securityForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Get value of security parameters
     */
    getValueSecurityForm(): ParameterI[] {
        const parameters: ParameterI[] = [];
        parameters.push(this.getObjectParameter('OTP_TYPE', 'otpType'));
        parameters.push(this.getObjectParameter('OTP_LONG', 'otpLong'));
        parameters.push(
            this.getObjectParameter('APP_ATTEMPS_LOGIN', 'attemps')
        );
        parameters.push(
            this.getObjectParameter('APP_INACTIVITY', 'inactivity')
        );
        parameters.push(this.getObjectParameter('APP_PWD_LONG', 'pwdLong'));
        parameters.push(this.getObjectParameter('APP_PWD_SPECIAL', 'pwdMayus'));
        parameters.push(this.getObjectParameter('APP_PWD_MAYUS', 'pwdMayus'));
        parameters.push(this.getObjectParameter('APP_PWD_NUMBER', 'pwdNumber'));
        return parameters;
    }

    /**
     * Return parameter
     * @param code
     * @param value
     * @returns
     */
    getObjectParameter(code: string, value: string): ParameterI {
        return {
            code,
            value: String(this.securityForm.get(value).value),
        };
    }
}
