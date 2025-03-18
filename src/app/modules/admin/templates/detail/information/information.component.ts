import { TextFieldModule } from '@angular/cdk/text-field';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewEncapsulation,
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
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { TemplateService } from '../../templates.service';
import { TemplateDataMongoI, TemplateI } from '../../templates.types';

@Component({
    selector: 'templates-information',
    templateUrl: './information.component.html',
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
        MatButtonModule,
        MatSlideToggleModule,
        RouterLink,
        MatProgressSpinnerModule,
    ],
})
export class TemplatesInformationComponent implements OnInit {
    template: TemplateI;
    templateForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _templateService: TemplateService,
        private _toastrService: ToastrService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.templateForm = this._formBuilder.group({
            name: ['', Validators.required],
            description: ['', [Validators.required, Validators.maxLength(255)]],
            status: [],
        });

        this._templateService.template$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((template) => {
                // Update the template
                this.template = template;

                if (this.template) {
                    this.templateForm.patchValue(this.template);
                }
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
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
     * Add template
     */
    newTemplate() {
        if (this.template) {
            this.updateTemplate();
            return;
        }

        // Return if the form is invalid
        if (this.templateForm.invalid) {
            return;
        }

        // Disable the form
        this.templateForm.disable();

        // ADD data
        this.templateForm.value.data = {
            header: { css: '.header{}', data: [], config: { backgroundImage: '' } },
            footer: { css: '.footer{}', data: [], config: { backgroundImage: '' } },
        } as TemplateDataMongoI;

        //Delete status
        delete this.templateForm.value.status;

        this._templateService
            .create(this.templateForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.templateForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                },
                error: (response) => {
                    // Re-enable the form
                    this.templateForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Update template
     */
    updateTemplate() {
        // Return if the form is invalid
        if (this.templateForm.invalid) {
            return;
        }

        // Disable the form
        this.templateForm.disable();

        this._templateService
            .update(this.template.id, this.templateForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.templateForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );
                },
                error: (response) => {
                    // Re-enable the form
                    this.templateForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }
}
