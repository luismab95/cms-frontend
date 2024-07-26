import { TextFieldModule } from '@angular/cdk/text-field';
import { NgClass } from '@angular/common';
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
    FormControl,
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
import { fuseAnimations } from '@fuse/animations';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { ParameterI } from '../parameter.interface';
import { ParameterService } from '../parameter.service';

@Component({
    selector: 'parameters-email',
    templateUrl: './email.component.html',
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
        TextFieldModule,
        MatSelectModule,
        MatOptionModule,
        MatButtonModule,
        NgClass,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
    ],
})
export class ParametersEmailComponent implements OnInit {
    @Input() parameters: ParameterI[] = [];
    @Output() refreshParameters: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    emailForm: UntypedFormGroup;
    emailTestControl: FormControl;
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
        this.emailForm = this._formBuilder.group({
            host: ['', Validators.required],
            port: ['', [Validators.required, Validators.pattern('^-?[0-9]+$')]],
            username: ['', Validators.required],
            password: ['', Validators.required],
            email: ['', [Validators.email, Validators.required]],
            secure: [''],
        });

        this.emailTestControl = new FormControl('', [
            Validators.email,
            Validators.required,
        ]);

        this.emailForm.patchValue({ ...this.getEmailParameters() });
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
    getEmailParameters() {
        return {
            host: this.getParameter('MAILER_HOST'),
            port: this.getParameter('MAILER_PORT'),
            username: this.getParameter('MAILER_USER'),
            password: this.getParameter('MAILER_PASSWORD'),
            email: this.getParameter('MAILER_FROM'),
            secure: this.getParameter('MAILER_SECURE') === 'true',
        };
    }

    /**
     * Cancel action
     */
    cancel() {
        this.emailForm.reset();
        this.emailForm.patchValue({ ...this.getEmailParameters() });
    }

    /**
     * Save action
     */
    save() {
        // Return if the form is invalid
        if (this.emailForm.invalid) {
            return;
        }

        // Disable the form
        this.emailForm.disable();

        this._parameterService
            .updateMultiple(this.getValueEmailForm())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.emailForm.enable();

                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');

                    // Emit refresh parameters
                    this.refreshParameters.emit(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.emailForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Test email
     * @returns
     */
    testEmail() {
        // Return if the form is invalid
        if (this.emailTestControl.invalid) {
            return;
        }

        // Disable the form
        this.emailTestControl.disable();

        this._parameterService
            .testEmail(this.emailTestControl.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.emailTestControl.enable();

                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');
                },
                error: (response) => {
                    // Re-enable the form
                    this.emailTestControl.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Get value of email parameters
     */
    getValueEmailForm(): ParameterI[] {
        const parameters: ParameterI[] = [];
        parameters.push(this.getObjectParameter('MAILER_HOST', 'host'));
        parameters.push(this.getObjectParameter('MAILER_PORT', 'port'));
        parameters.push(this.getObjectParameter('MAILER_USER', 'username'));
        parameters.push(this.getObjectParameter('MAILER_PASSWORD', 'password'));
        parameters.push(this.getObjectParameter('MAILER_FROM', 'email'));
        parameters.push(this.getObjectParameter('MAILER_SECURE', 'secure'));
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
            value: String(this.emailForm.get(value).value),
        };
    }
}
