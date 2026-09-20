import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { FileI, FilePaginationResquestI, FileUploadI } from 'app/core/interfaces/file.interface';
import { FileManagerService } from 'app/core/services/file-manager.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { Subject, debounceTime, of, switchMap, takeUntil } from 'rxjs';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { FileService } from 'app/core/services/file.service';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { CmsValidators } from 'app/shared/utils/validators.util';

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
  loadFile = signal<File | null>(null);

  searchInputControl: FormControl = new FormControl();
  fileForm!: UntypedFormGroup;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  private readonly _fileManagerService = inject(FileManagerService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _fileService = inject(FileService);
  private readonly _formBuilder = inject(UntypedFormBuilder);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });
  readonly files = toSignal(this._fileManagerService.files$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  urlPreview = computed(() => {
    const seletedFile = this.selectedFile();
    if (seletedFile === null) return '';
    if (seletedFile.id !== null) return seletedFile.url;

    const file = this.loadFile();
    return file ? URL.createObjectURL(file) : null;
  });

  /**
   * Constructor
   */
  constructor() {
    this.urlStatics.set(findParameter('APP_STATICS_URL', this.parameters())?.value!);
    effect(() => {
      const mimeType = this.mimeType();
      this.getAll(1, null, true, mimeType!);
    });
    this.fileForm = this._formBuilder.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.maxLength(255)]],
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
        if (search) this.getAll(1, search === '' ? null : search, null, this.mimeType()!);
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
  getAll(
    page: number,
    search: string | null = null,
    status: boolean | null = null,
    mimeType: string,
  ) {
    const params: FilePaginationResquestI = {
      page,
      limit: this.limit(),
      mimeType,
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
    this.fileForm.get('name')?.setValue(file.name);
    this.fileForm.get('description')?.setValue(file.description);
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
    this.getAll(1, null, null, this.mimeType()!);
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
  isVideo(file: FileI): boolean {
    return file.mimeType?.startsWith('video/') ?? false;
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
    if (this.selectedFile()?.id === null) {
      this.new();
    } else {
      this.onSelectedFileEvent.emit(this.selectedFile()?.path!);
    }
  }

  /**
   * Add file
   */
  new() {
    if (this.selectedFile()?.id !== null) {
      return;
    }

    const file = this.loadFile();

    const upload$ =
      file !== null
        ? this._fileService.uploadFile(file, false)
        : of<ResponseI<FileUploadI> | null>(null);

    upload$
      .pipe(
        switchMap((response) => {
          if (response?.message?.path) {
            const selectedFile = this.selectedFile();
            const fileForm = this.fileForm.value;
            if (selectedFile) {
              this.selectedFile.set({
                ...selectedFile,
                path: response.message.path,
                name: fileForm.name,
                description: fileForm.description,
                filename: response.message.filename,
                mimeType: response.message.mimetype,
                size: response.message.size,
              });
            }
          }
          return this._fileManagerService.create(this.selectedFile()!);
        }),
        takeUntil(this._unsubscribeAll),
      )
      .subscribe({
        next: () => {
          this.onSelectedFileEvent.emit(this.selectedFile()?.path!);
        },
        error: (response) => {
          this._toastrService.error(
            response.error?.message || 'No fue posible cargar el archivo.',
            'Error al cargar',
          );
        },
      });
  }

  /**
   * set file to save
   * @param event
   */
  setFile(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.loadFile.set(file);
    const newFile = {
      id: null,
      description: '',
      name: file.name,
      mimeType: file.type,
      size: file.size,
      filename: file.name,
    } as unknown as FileI;

    this.selectedFile.set(newFile);
  }
}
