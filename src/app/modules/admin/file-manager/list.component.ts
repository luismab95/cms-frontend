import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
    inject,
} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormControl,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PaginationComponent } from 'app/shared/components/pagination/pagination.component';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import {
    PaginationResponseI,
    PaginationResquestI,
} from 'app/shared/interfaces/response.interface';
import { FileService } from 'app/shared/services/file.service';
import { ModalService } from 'app/shared/services/modal.service';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { FileManagerDetailsComponent } from './details/details.component';
import { FileManagerService } from './file-manager.service';
import { FileI } from './file-manager.types';

@Component({
    selector: 'file-manager-list',
    templateUrl: './list.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatSidenavModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatInputModule,
        AsyncPipe,
        PaginationComponent,
        ReactiveFormsModule,
        FormsModule,
        PermissionComponent,
    ],
})
export class FileManagerListComponent implements OnInit, OnDestroy {
    @ViewChild('matDrawer', { static: true }) matDrawer: MatDrawer;

    drawerMode: 'side' | 'over';
    files$: Observable<PaginationResponseI<FileI[]>>;
    filesCount: number = 0;
    isLoading: boolean = false;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    permission = PermissionCode;
    private _fileService = inject(FileService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fileManagerService: FileManagerService,
        private _modalSvc: ModalService,
        private _toastrService: ToastrService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the items

        this.files$ = this._fileManagerService.files$;
        this._fileManagerService.files$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((items) => {
                this.files$ = this._fileManagerService.files$;
                this.filesCount = items.total;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(debounceTime(700))
            .subscribe((search: string) => {
                this.getAll(
                    {
                        pageSize: 10,
                        pageIndex: 0,
                        length: this.filesCount,
                    },
                    search === '' ? null : search,
                    search === '' ? true : null
                );
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
     * Get all
     * @param page
     */
    getAll(
        event: PageEvent,
        search: string | null = null,
        status: boolean = true
    ) {
        const params: PaginationResquestI = {
            page: event?.pageIndex + 1,
            limit: event?.pageSize,
            search,
            status,
        };
        this.isLoading = true;
        this._fileManagerService
            .getFiles(params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.isLoading = false;
                },
                error: (response) => {
                    this.isLoading = false;

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Remove the image on the given note
     * @param event
     */
    uploadImage(event: any) {
        const file: File = event.target.files[0];
        this._fileService.uploadFile(file).subscribe({
            next: (response) => {
                this._toastrService.success(
                    'Proceso realizado con éxito.',
                    'Aviso'
                );
                this.getAll({
                    pageSize: 10,
                    pageIndex: 0,
                    length: this.filesCount,
                });
            },
            error: (response) => {
                // Set the alert
                this._toastrService.error(response.error.message, 'Aviso');
            },
        });
    }

    /**
     * Open modal files detail
     *
     * @param data
     */
    openDetailsModal(data?: FileI): void {
        const dialogRef = this._modalSvc.openModal<
            FileManagerDetailsComponent,
            FileI
        >(FileManagerDetailsComponent, data);

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.getAll({
                    pageSize: 10,
                    pageIndex: 0,
                    length: this.filesCount,
                });
            }
        });
    }

    /**
     * Valid render permission
     */
    validPermission(code: string) {
        return validAction(code);
    }
}
