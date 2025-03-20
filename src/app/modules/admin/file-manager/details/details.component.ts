import { ClipboardModule } from '@angular/cdk/clipboard';
import { TextFieldModule } from '@angular/cdk/text-field';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FileService } from 'app/shared/services/file.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { FileManagerService } from '../file-manager.service';
import { FileI } from '../file-manager.types';
@Component({
    selector: 'file-manager-details',
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatInputModule,
        MatFormFieldModule,
        MatTooltipModule,
        NgTemplateOutlet,
        TextFieldModule,
        ReactiveFormsModule,
        FormsModule,
        MatProgressSpinnerModule,
        ClipboardModule,
    ],
})
export class FileManagerDetailsComponent implements OnInit, OnDestroy {
    file: FileI;
    editMode: boolean = false;
    fileForm: UntypedFormGroup;

    private _fileManagerService = inject(FileManagerService);
    private _fileService = inject(FileService);
    private readonly _matDialog = inject(MAT_DIALOG_DATA);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _fuseConfirmationService: FuseConfirmationService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        public _matDialogRef: MatDialogRef<FileManagerDetailsComponent>,
        private _toastrService: ToastrService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the file form
        this.fileForm = this._formBuilder.group({
            description: ['', [Validators.required, Validators.maxLength(255)]],
        });

        if (this._matDialog) {
            this.file = this._matDialog;
            this.fileForm.patchValue({ ...this.file });
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
     * Delete the file
     */
    deleteFile(): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: `Eliminar archivo`,
            message: `¿Estás seguro de que deseas eliminar este archivo?.`,
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
                // Mark for check
                this.delete();
            }
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
     * Update file
     */
    updateFile() {
        // Return if the form is invalid
        if (this.fileForm.invalid) {
            return;
        }

        // Disable the form
        this.fileForm.disable();

        this._fileManagerService
            .update(this.file.id, this.fileForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.fileForm.enable();
                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');

                    this._matDialogRef.close(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.fileForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Delete file
     */
    delete() {
        // Disable the form
        this.fileForm.disable();

        this._fileManagerService
            .delete(this.file.id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.fileForm.enable();
                    // Set the alert
                    this._toastrService.success(response.message, 'Aviso');

                    this._matDialogRef.close(true);
                },
                error: (response) => {
                    // Re-enable the form
                    this.fileForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Download file
     */
    downloadFile() {
        this._fileService.downloadFile(this.file.url).subscribe({
            next: (response) => {
                // Re-enable the form
                this.fileForm.enable();
                // Download file
                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(response);
                link.download = this.file.filename;
                link.click();
            },
            error: (response) => {
                // Re-enable the form
                this.fileForm.enable();

                // Set the alert
                this._toastrService.error(response.error.message, 'Aviso');
            },
        });
    }

    /**
     * Get file URL
     */
    getURL() {
        return this.file.url;
    }

    /**
     * Output copy event
     * @param event
     */
    copyEvent(event: true) {
        // Set the alert
        this._toastrService.info('Url Copiada.', 'Aviso');
    }
}
