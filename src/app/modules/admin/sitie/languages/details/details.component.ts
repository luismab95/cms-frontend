import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
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
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { FileService } from 'app/shared/services/file.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { SitieService } from '../../sitie.service';
import { SitieI } from '../../sitie.types';
import { LanguageService } from '../language.service';
import { LanguageI } from '../language.types';

@Component({
    selector: 'sitie-languages-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatTooltipModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule,
        NgTemplateOutlet,
    ],
})
export class SitieLanguagesDetailsComponent implements OnInit, OnDestroy {
    editMode: boolean = false;
    languageForm: UntypedFormGroup;
    language: LanguageI;
    sitie: SitieI;
    urlStatics: string;

    private readonly _matDialog = inject(MAT_DIALOG_DATA);
    private _parameterService = inject(ParameterService);
    private _fileService = inject(FileService);
    private _languageService = inject(LanguageService);
    private _sitieService = inject(SitieService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _toastrService: ToastrService,
        public _matDialogRef: MatDialogRef<SitieLanguagesDetailsComponent>
    ) {
        this._parameterService.parameter$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((parameters: ParameterI[]) => {
                this.urlStatics = this.getParameter(
                    'APP_STATICS_URL',
                    parameters
                );
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
        // Create the language form
        this.languageForm = this._formBuilder.group({
            name: ['', [Validators.required]],
            lang: ['', [Validators.required]],
            icon: ['', [Validators.required]],
            sitieId: ['', [Validators.required]],
        });
        if (this._matDialog) {
            this.language = this._matDialog;
            this.languageForm.patchValue({ ...this.language });
        } else {
            this._sitieService.sitie$
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((sitie) => {
                    // Mark for check
                    this.languageForm.get('sitieId').setValue(sitie.id);
                    this._changeDetectorRef.markForCheck();
                });
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
     * Add language
     */
    create() {
        // Return if the form is invalid
        if (this.languageForm.invalid) {
            return;
        }

        // Disable the form
        this.languageForm.disable();

        this._languageService
            .create(this.languageForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.languageForm.enable();
                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');

                    this._matDialogRef.close(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.languageForm.enable();
                    // Reset the form
                    this.languageForm.reset();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Update language
     */
    update() {
        // Return if the form is invalid
        if (this.languageForm.invalid) {
            return;
        }

        // Disable the form
        this.languageForm.disable();

        this._languageService
            .update(this.language.id, this.languageForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.languageForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );

                    this._matDialogRef.close(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.languageForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Delete language
     */
    delete() {
        // Disable the form
        this.languageForm.disable();

        this._languageService
            .delete(this.language.id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.languageForm.enable();
                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');

                    this._matDialogRef.close(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.languageForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Toggle edit mode
     *
     * @param editMode
     */
    toggleEditMode(editMode: boolean | null = null): void {
        if (editMode === null) {
            this.editMode = !this.editMode;
        } else {
            this.editMode = editMode;
        }

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Toggle the language
     */
    toggleLanguage(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: `${this.language.status ? 'Inactivar' : 'Activar'} idioma`,
            message: `¿Estás seguro de que deseas ${this.language.status ? 'inactivar' : 'activar'} este idioma?.`,
            actions: {
                confirm: {
                    label: 'Aceptar',
                    color: 'primary',
                },
                cancel: {
                    label: 'Cancelar',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                this.delete();
            }
        });
    }

    /**
     * Get parameter
     * @param code
     */
    getParameter(code: string, parameters: ParameterI[]) {
        if (parameters.length > 0) {
            return findParameter(code, parameters).value;
        }
    }

    /**
     * Get icon
     * @returns
     */
    getICon(icon: string) {
        return `${this.urlStatics}/${icon}`;
    }

    /**
     * Remove the image on the given note
     * @param event
     */
    uploadFile(event: any) {
        const file: File = event.target.files[0];
        this._fileService.uploadFile(file).subscribe({
            next: (response) => {
                this.languageForm.get('icon').setValue(response.message.path);
                // Mark for check
                this._changeDetectorRef.markForCheck();
            },
            error: (response) => {
                // Set the alert
                this._toastrService.error(response.error.message, 'Aviso');
            },
        });
    }
}
