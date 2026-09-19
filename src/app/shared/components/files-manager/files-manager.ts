import { Component, OnDestroy, OnInit, effect, inject, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FileI, FilePaginationResquestI } from 'app/core/interfaces/file.interface';
import { FileManagerService } from 'app/core/services/file-manager.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { ToastrService } from '@iqx-limited/ngx-toastr';

@Component({
  selector: 'files-manager',
  templateUrl: './files-manager.html',
  imports: [ReactiveFormsModule, NgClass],
})
export class ImagesManagerComponent implements OnInit, OnDestroy {
  mimeType = input<string | null>(null);
  onSelectedFileEvent = output<string | null>();

  urlStatics = signal<string>('');
  limit = signal<number>(999999999);
  selectedFile = signal<FileI | null>(null);

  searchInputControl: FormControl = new FormControl();

  private _fileManagerService = inject(FileManagerService);
  private _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });
  readonly files = toSignal(this._fileManagerService.files$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  /**
   * Constructor
   */
  constructor() {
    this.urlStatics.set(findParameter('APP_STATICS_URL', this.parameters())?.value!);
    effect(() => {
      const mimeType = this.mimeType();
      this.getAll(1, null, true);
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    this.searchInputControl.valueChanges
      .pipe(debounceTime(700), takeUntil(this._unsubscribeAll))
      .subscribe((search: string) => {
        if (search) this.getAll(1, search === '' ? null : search, null);
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

  /**
   * Get all
   * @param page
   */
  getAll(page: number, search: string | null = null, status: boolean | null = null) {
    const params: FilePaginationResquestI = {
      page,
      limit: this.limit(),
      mimeType: this.mimeType(),
      search,
      status,
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
   * Select file

   */
  selectFile(file: FileI) {
    this.selectedFile.set(file);
  }

  /**
   * close file manager
   */
  closeFileManager() {
    this.onSelectedFileEvent.emit(null);
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.searchInputControl.reset();
    this.getAll(1, null, null);
  }

  /**
   * 
   * @param file 
   * @returns 
   */
  isImage(file: FileI): boolean {
    return file.mimeType?.startsWith('image/') ?? false;
  }

  /**
   * 
   * @param file 
   * @returns 
   */
  isSvg(file: FileI): boolean {
    return file.mimeType === 'image/svg+xml';
  }

  /**
   * 
   * @param file 
   * @returns 
   */
  isPdf(file: FileI): boolean {
    return file.mimeType === 'application/pdf';
  }

  /**
   * 
   * @param file 
   * @returns 
   */
  isAudio(file: FileI): boolean {
    return file.mimeType?.startsWith('audio/') ?? false;
  }

  /**
   * 
   * @param file 
   * @returns 
   */
  getFileExtension(file: FileI): string {
    return file.filename?.split('.').pop()?.toUpperCase() ?? '';
  }

  /**
   * 
   * @param size 
   * @returns 
   */
  formatFileSize(size?: number): string {
    if (!size) {
      return '0 KB';
    }

    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Select file
   */
  onSelectFile() {
    this.onSelectedFileEvent.emit(this.selectedFile()?.path!);
  }
}
