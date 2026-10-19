import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { FileI, FilePaginationResquestI } from '@core/interfaces';
import { FileManagerService } from '@core/services';
import { PaginationComponent, PermissionComponent, TitleHeaderComponent } from '@shared/components';
import { PermissionCode, validAction } from '@shared/utils';
import { TableSearchI } from '@shared/interfaces';
import { FileManagerDetailsComponent } from './details/details';
import {  debounceTime } from 'rxjs';

@Component({
  selector: 'files-list',
  templateUrl: './list.html',
  imports: [
    PaginationComponent,
    PermissionComponent,
    FileManagerDetailsComponent,
    NgClass,
    TitleCasePipe,
    TitleHeaderComponent,
    FormField,
  ],
})
export class FileManagerList {
  limit = signal<number>(10);
  showDetails = signal<boolean>(false);
  selectedFile = signal<FileI | null>(null);
  tableSearchModel = signal<TableSearchI>({
    search: '',
    status: null,
  });

  tableSearchForm = form(this.tableSearchModel);

  private readonly _fileManagerService = inject(FileManagerService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly files = this._fileManagerService.files;

  readonly totalFiles = computed(() => this.files().total);

  /**
   * Constructor
   */
  constructor() {
    toObservable(this.tableSearchForm.search().value)
      .pipe(debounceTime(600), takeUntilDestroyed(this._destroyRef))
      .subscribe((search) => {
        if (search) this.getAll(1, search === '' ? null : search, this.tableSearchModel().status);
      });

    toObservable(this.tableSearchForm.status().value)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((status) => {
        this.getAll(
          1,
          this.tableSearchModel().search === '' ? null : this.tableSearchModel().search,
          status,
        );
      });
  }

  /**
   * Get all
   * @param page
   * @param search
   * @param status
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
      .pipe(takeUntilDestroyed(this._destroyRef))
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
      this.tableSearchModel().search === '' ? null : this.tableSearchModel().search,
      this.tableSearchModel().status,
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
      this.tableSearchModel().search === '' ? null : this.tableSearchModel().search,
      this.tableSearchModel().status,
    );
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.tableSearchModel.update((prev) => ({ ...prev, search: '' }));
    this.getAll(1, null, this.tableSearchModel().status);
  }

  /**
   * Close modal
   * @param load
   */
  closeModal(load: boolean) {
    this.selectedFile.set(null);
    this.showDetails.set(false);
    if (load) this.onChangeStatus(null);
  }

  /**
   * Change status
   * @param status
   */
  onChangeStatus(status: boolean | null) {
    this.tableSearchModel.update((prev) => ({ ...prev, status }));
    this.onPageChange(1);
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
}
