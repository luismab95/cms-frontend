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
import { fuseAnimations } from '@fuse/animations';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { ParameterI } from '../parameter.interface';
import { ParameterService } from '../parameter.service';

@Component({
    selector: 'parameters-company',
    templateUrl: './company.component.html',
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
        MatProgressSpinnerModule,
    ],
})
export class ParametersCompanyComponent implements OnInit {
    @Input() parameters: ParameterI[] = [];
    @Output() refreshParameters: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    companyForm: UntypedFormGroup;
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
        this.companyForm = this._formBuilder.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            website: [
                '',
                [
                    Validators.required,
                    Validators.pattern(
                        /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
                    ),
                ],
            ],
            urlStatics: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', Validators.required],
            country: ['', Validators.required],
        });

        this.companyForm.patchValue({ ...this.getCompanyParameters() });
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
    getCompanyParameters() {
        return {
            name: this.getParameter('COMPANY_NAME'),
            description: this.getParameter('COMPANY_DESCRIPTION'),
            website: this.getParameter('COMPANY_WEBSITE'),
            urlStatics: this.getParameter('APP_STATICS_URL'),
            email: this.getParameter('COMPANY_MAIL'),
            phone: this.getParameter('COMPANY_PHONE'),
            country: this.getParameter('COMPANY_COUNTRY'),
        };
    }

    /**
     * Save action
     */
    save() {
        // Return if the form is invalid
        if (this.companyForm.invalid) {
            return;
        }

        // Disable the form
        this.companyForm.disable();

        this._parameterService
            .updateMultiple(this.getValueCompanyForm())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.companyForm.enable();
                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');
                    // Emit refresh parameters
                    this.refreshParameters.emit(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.companyForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Get value of company parameters
     */
    getValueCompanyForm(): ParameterI[] {
        const parameters: ParameterI[] = [];
        parameters.push(this.getObjectParameter('COMPANY_NAME', 'name'));
        parameters.push(
            this.getObjectParameter('COMPANY_DESCRIPTION', 'description')
        );
        parameters.push(this.getObjectParameter('COMPANY_WEBSITE', 'website'));
        parameters.push(
            this.getObjectParameter('APP_STATICS_URL', 'urlStatics')
        );
        parameters.push(this.getObjectParameter('COMPANY_MAIL', 'email'));
        parameters.push(this.getObjectParameter('COMPANY_PHONE', 'phone'));
        parameters.push(this.getObjectParameter('COMPANY_COUNTRY', 'country'));
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
            value: this.companyForm.get(value).value,
        };
    }

    /**
     * Cancel action
     */
    cancel() {
        this.companyForm.reset();
        this.companyForm.patchValue({ ...this.getCompanyParameters() });
    }
}
