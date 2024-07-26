import { TextFieldModule } from '@angular/cdk/text-field';
import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
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
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { fuseAnimations } from '@fuse/animations';
import { FileService } from 'app/shared/services/file.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { ParameterI } from '../parameter.interface';
import { ParameterService } from '../parameter.service';

@Component({
    selector: 'parameters-logos',
    templateUrl: './logos.component.html',
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
    ],
})
export class ParametersLogosComponent implements OnInit {
    @Input() parameters: ParameterI[] = [];
    @Output() refreshParameters: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    logoForm: UntypedFormGroup;
    private _parameterService = inject(ParameterService);
    private _fileService = inject(FileService);
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
        // Create the form
        this.logoForm = this._formBuilder.group({
            primary: [''],
            secondary: [''],
            icon: [''],
            email: [''],
            authBackground: [''],
        });

        this.logoForm.patchValue({ ...this.getCompanyParameters() });
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
     * Update value
     * @param code
     * @param value
     */
    uploadImage(code: string, value: string): void {
        this.logoForm.get(code).setValue(value);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Remove the image on the given note
     * @param event
     * @param code
     */
    removeImage(event: any, code: string) {
        const file: File = event.target.files[0];
        this._fileService.uploadFile(file).subscribe({
            next: (response) => {
                this.uploadImage(code, response.message.path);
            },
            error: (response) => {
                // Set the alert
                this._toastrService.error(response.error.message, 'Aviso');
            },
        });
    }

    /**
     * Get parameters
     * @returns
     */
    getCompanyParameters() {
        return {
            primary: this.getParameter('LOGO_PRIMARY'),
            secondary: this.getParameter('LOGO_SECONDARY'),
            icon: this.getParameter('LOGO_ICON'),
            authBackground: this.getParameter('LOGO_AUTH_BACKGROUND'),
            email: this.getParameter('LOGO_MAIL'),
        };
    }

    /**
     * Cancel action
     */
    cancel() {
        this.logoForm.reset();
        this.logoForm.patchValue({ ...this.getCompanyParameters() });
    }

    /**
     * Save action
     */
    save() {
        // Return if the form is invalid
        if (this.logoForm.invalid) {
            return;
        }

        // Disable the form
        this.logoForm.disable();

        this._parameterService
            .updateMultiple(this.getValueLogosForm())
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.logoForm.enable();

                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');

                    // Emit refresh parameters
                    this.refreshParameters.emit(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.logoForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Get value of logos parameters
     */
    getValueLogosForm(): ParameterI[] {
        const parameters: ParameterI[] = [];
        parameters.push(this.getObjectParameter('LOGO_PRIMARY', 'primary'));
        parameters.push(this.getObjectParameter('LOGO_SECONDARY', 'secondary'));
        parameters.push(this.getObjectParameter('LOGO_ICON', 'icon'));
        parameters.push(
            this.getObjectParameter('LOGO_AUTH_BACKGROUND', 'authBackground')
        );
        parameters.push(this.getObjectParameter('LOGO_MAIL', 'email'));
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
            value: this.logoForm.get(value).value,
        };
    }

    /**
     * Return parameter
     * @param code
     * @returns
     */
    getValue(code: string) {
        return `${findParameter('APP_STATICS_URL', this.parameters).value}/${this.logoForm.get(code).value}`;
    }
}
