import { TextFieldModule } from '@angular/cdk/text-field';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
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
import { RouterLink } from '@angular/router';
import { SitieService } from 'app/modules/admin/sitie/sitie.service';
import { SitieI } from 'app/modules/admin/sitie/sitie.types';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { MicrosityService } from '../../micrositie.service';
import { MicrositieI } from '../../micrositie.types';

@Component({
    selector: 'microsities-information',
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
        MatSelectModule,
        MatOptionModule,
        MatButtonModule,
        RouterLink,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
    ],
})
export class MicrositiesInformationComponent implements OnInit {
    sitie: SitieI;
    micrositie: MicrositieI;
    micrositieForm: UntypedFormGroup;

    private _sitieService = inject(SitieService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _microsityService: MicrosityService,
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
        this.micrositieForm = this._formBuilder.group({
            name: ['', Validators.required],
            description: ['', [Validators.required, Validators.maxLength(255)]],
            sitieId: ['', Validators.required],
            status: [],
        });

        this._microsityService.micrositie$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((micrositie) => {
                // Update the micrositie
                this.micrositie = micrositie;

                if (this.micrositie) {
                    this.micrositieForm.patchValue({ ...this.micrositie });
                }
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this._sitieService.sitie$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((sitie) => {
                this.sitie = sitie;
                this.micrositieForm.get('sitieId').setValue(sitie.id);

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
     * Add micrositie
     */
    create() {
        if (this.micrositie) {
            this.update();
            return;
        }

        // Return if the form is invalid
        if (this.micrositieForm.invalid) {
            return;
        }

        // Disable the form
        this.micrositieForm.disable();

        // Delete status
        delete this.micrositieForm.value.status;

        this._microsityService
            .create(this.micrositieForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.micrositieForm.enable();
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
                    this.micrositieForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Update micrositie
     */
    update() {
        // Return if the form is invalid
        if (this.micrositieForm.invalid) {
            return;
        }

        // Disable the form
        this.micrositieForm.disable();

        this._microsityService
            .update(this.micrositie.id, this.micrositieForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.micrositieForm.enable();
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
                    this.micrositieForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Visit micrositie
     */
    visit() {
        window.open(`${this.sitie.domain}/${this.micrositie.path}`, '_blank');
    }
}
