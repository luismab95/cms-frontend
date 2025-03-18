import { TextFieldModule } from '@angular/cdk/text-field';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewEncapsulation,
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
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { TemplateService } from '../../templates/templates.service';
import { TemplateI } from '../../templates/templates.types';
import { SitieService } from '../sitie.service';
import { SitieI } from '../sitie.types';

@Component({
    selector: 'sitie-information',
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
        MatSelectModule,
        MatOptionModule,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
    ],
})
export class SitieInformationComponent implements OnInit {
    sitieForm: UntypedFormGroup;
    sitie = signal<SitieI>(null);
    templates: TemplateI[] = [];
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _sitieService: SitieService,
        private _templateService: TemplateService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _toastrService: ToastrService
    ) {
        // Get sitie
        this._sitieService.sitie$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((sitie) => {
                // Update the sitie
                this.sitie.set(sitie);

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get templates
        this._templateService.templates$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((templates) => {
                // Update the sitie
                this.templates = templates.records;

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
        this.sitieForm = this._formBuilder.group({
            name: ['', Validators.required],
            domain: [
                '',
                [
                    Validators.required,
                    Validators.pattern(
                        /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(\/.*)?$/
                    ),
                ],
            ],
            description: ['', [Validators.required, Validators.maxLength(255)]],
            status: [],
            maintenance: [],
            templateId: ['', Validators.required],
        });

        if (this.sitie()) {
            this.sitieForm.patchValue({ ...this.sitie() });
        }
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
     * Visit action
     */
    visit() {
        window.open(this.sitie().domain, '_blank');
    }

    /**
     * Save action
     */
    save() {
        // Return if the form is invalid
        if (this.sitieForm.invalid) {
            return;
        }

        // Disable the form
        this.sitieForm.disable();

        this._sitieService
            .update(this.sitie().id, this.sitieForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.sitieForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );
                },
                error: (response) => {
                    // Re-enable the form
                    this.sitieForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Cancel action
     */
    cancel() {
        this.sitieForm.reset();
        this.sitieForm.patchValue({ ...this.sitie() });
    }
}
