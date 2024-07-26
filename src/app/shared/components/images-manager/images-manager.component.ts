import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    inject,
} from '@angular/core';
import { ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FileManagerService } from 'app/modules/admin/file-manager/file-manager.service';
import { FileI } from 'app/modules/admin/file-manager/file-manager.types';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { PaginationResquestI } from 'app/shared/interfaces/response.interface';
import { FileService } from 'app/shared/services/file.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { ToastrService } from 'ngx-toastr';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
    selector: 'images-manager',
    templateUrl: './images-manager.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [
        `
            .images-manager-dialog-panel {
                width: 100%;
                @screen md {
                    @apply w-3/5;
                }

                .mat-mdc-dialog-container {
                    .mat-mdc-dialog-surface {
                        padding: 0 !important;
                    }
                }
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        MatTabsModule,
        MonacoEditorModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
    ],
})
export class ImagesManagerComponent implements OnInit, OnDestroy {
    files: FileI[] = [];
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    urlStatics: string;
    selectedImage: string;

    private _fileService = inject(FileService);
    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _toastrService: ToastrService,
        private _fileManagerService: FileManagerService,
        private _changeDetectorRef: ChangeDetectorRef,
        public _matDialogRef: MatDialogRef<ImagesManagerComponent>
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
        this.getAll('image');
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(debounceTime(700))
            .subscribe((search: string) => {
                this.getAll(search === '' ? null : search);
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
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Get all
     * @param page
     */
    getAll(search: string | null = null) {
        const params: PaginationResquestI = {
            page: 1,
            limit: 20,
            search,
            status: true,
        };
        this._fileManagerService
            .getFiles(params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.files = res.message.records;

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                },
                error: (response) => {
                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Get image
     * @returns
     */
    getImage(file: FileI) {
        return `${this.urlStatics}/${file.path}`;
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
     * Remove the image on the given note
     * @param event
     */
    uploadImage(event: any) {
        const file: File = event.target.files[0];
        this._fileService.uploadFile(file).subscribe({
            next: (response) => {
                this.selectImage(response.message.path);
            },
            error: (response) => {
                // Set the alert
                this._toastrService.error(response.error.message, 'Aviso');
            },
        });
    }

    /**
     * Select Image
     * @param path
     */
    selectImage(path: string) {
        this._matDialogRef.close(path);
    }
}
