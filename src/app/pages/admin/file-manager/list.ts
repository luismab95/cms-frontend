import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { PaginationComponent } from 'app/shared/components/pagination/pagination';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { FileManagerDetailsComponent } from './details/details';
import { FileI, FilePaginationResquestI } from 'app/core/interfaces/file.interface';
import { FileManagerService } from 'app/core/services/file-manager.service';
import { TitleHeaderComponent } from 'app/shared/components/title-header/title-header';
import { Subject, takeUntil, debounceTime } from 'rxjs';

@Component({
  selector: 'files-list',
  templateUrl: './list.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    PermissionComponent,
    FileManagerDetailsComponent,
    NgClass,
    TitleCasePipe,
    TitleHeaderComponent,
  ],
})
export class FileManagerList implements OnInit, OnDestroy {
  limit = signal<number>(10);
  showDetails = signal<boolean>(false);
  selectedFile = signal<FileI | null>(null);

  searchInputControl: UntypedFormControl = new UntypedFormControl();
  statusControl: FormControl<boolean | null> = new FormControl(null);

  permission = PermissionCode;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _fileManagerService = inject(FileManagerService);
  private readonly _toastrService = inject(ToastrService);

  readonly files = toSignal(this._fileManagerService.files$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  readonly totalFiles = computed(() => this.files().total);

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to search input field value changes
    this.searchInputControl.valueChanges
      .pipe(debounceTime(700), takeUntil(this._unsubscribeAll))
      .subscribe((search: string) => {
        if (search) this.getAll(1, search === '' ? null : search, this.statusControl.value);
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((status: boolean | null) => {
        this.getAll(
          1,
          this.searchInputControl.value === '' ? null : this.searchInputControl.value,
          status,
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
  getAll(page: number, search: string | null = null, status: boolean | null = null) {
    const params: FilePaginationResquestI = {
      page,
      limit: this.limit(),
      search,
      status,
      mimeType: null,
    };
    this._fileManagerService
      .getFiles(params)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        error: (response) => {
          this._toastrService.error(response.error.message, 'Aviso');
        },
      });
  }

  /**
   * Open modal laguanges detail
   *
   * @param data
   */
  openDetailsModal(file: FileI | null): void {
    this.selectedFile.set(file);
    this.showDetails.set(true);
  }

  /**
   * Valid render permission
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   * On Page change
   * @param page
   */
  onPageChange(page: number): void {
    this.getAll(
      page,
      this.searchInputControl.value === '' ? null : this.searchInputControl.value,
      this.statusControl.value,
    );
  }

  /**
   * On limit change
   * @param limit
   */
  onLimitChange(limit: number): void {
    this.limit.set(limit);
    this.getAll(
      1,
      this.searchInputControl.value === '' ? null : this.searchInputControl.value,
      this.statusControl.value,
    );
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.searchInputControl.reset();
    this.getAll(1, null, this.statusControl.value);
  }

  /**
   * Close modal
   */
  closeModal(load: boolean) {
    this.selectedFile.set(null);
    this.showDetails.set(false);
    if (load) {
      this.onChangeStatus(null);
    }
  }

  /**
   * Get icon
   * @param mimeType
   * @returns
   */
  getFileIcon(mimeType?: string): string {
    const type = mimeType?.toLowerCase() ?? '';

    if (type.includes('pdf')) {
      return 'fa-solid fa-file-pdf text-red-600';
    }

    if (type.startsWith('audio/')) {
      return 'fa-solid fa-file-audio text-blue-600';
    }

    if (type.startsWith('video/')) {
      return 'fa-solid fa-file-video text-green-600';
    }

    if (type.startsWith('text/')) {
      return 'fa-solid fa-file-lines text-gray-600';
    }

    if (type.startsWith('image/')) {
      return 'fa-solid fa-file-image text-purple-600';
    }

    return 'fa-solid fa-file text-gray-500';
  }

  /**
   * Change status
   * @param status
   */
  onChangeStatus(status: boolean | null) {
    this.statusControl.setValue(status);
  }
}
