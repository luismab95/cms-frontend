import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { FileI, FilePaginationResquestI, FileUploadI } from '@core/interfaces';
import { FileManagerService, ParameterService, FileService } from '@core/services';
import { ResponseI } from '@shared/interfaces';
import { findParameter, hasErrorFormField } from '@shared/utils';
import { debounceTime, firstValueFrom, of, switchMap } from 'rxjs';

@Component({
  selector: 'files-manager',
  templateUrl: './files-manager.html',
  imports: [FormField, NgClass],
})
export class ImagesManagerComponent {
  mimeType = input<string | null>(null);
  onSelectedFileEvent = output<string | null>();

  limit = signal<number>(999999999);
  selectedFile = signal<FileI | null>(null);
  loadFile = signal<File | null>(null);
  fileModel = signal<{ name: string; description: string; search: string }>({
    name: '',
    description: '',
    search: '',
  });

  fileForm = form(this.fileModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es obligatorio.' });
    required(schemaPath.description, { message: 'Descripción es obligatorio.' });
    maxLength(schemaPath.description, 255, {
      message: 'Descripción no puede superar los 255 caracteres.',
    });
  });

  private readonly _fileManagerService = inject(FileManagerService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _fileService = inject(FileService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;
  readonly parameters = this._parameterService.publicParameters;
  readonly files = this._fileManagerService.files;

  readonly urlPreview = computed(() => {
    const seletedFile = this.selectedFile();
    if (seletedFile === null) return '';
    if (seletedFile.id !== null) return seletedFile.url;
    const file = this.loadFile();
    return file ? URL.createObjectURL(file) : null;
  });
  readonly urlStatics = computed(() => findParameter('APP_STATICS_URL', this.parameters())?.value!);

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const mimeType = this.mimeType();
      this.getAll(1, null, true, mimeType!);
    });

    toObservable(this.fileForm.search().value)
      .pipe(debounceTime(700), takeUntilDestroyed(this._destroyRef))
      .subscribe((search: string) => {
        if (search) this.getAll(1, search === '' ? null : search, null, this.mimeType()!);
      });
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
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        error: (response) => {
          this._toastrService.error(response.error.message, 'Aviso');
        },
      });
  }

  /**
   * Select file
   * @param file
   */
  selectFile(file: FileI) {
    this.fileModel.update((prev) => ({ ...prev, name: file.name, description: file.description }));
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
    this.fileModel.update((prev) => ({ ...prev, search: '' }));
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
   * Format size file
   * @param size
   * @returns
   */
  formatFileSize(size?: number): string {
    if (!size) return '0 KB';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Select file
   * @param event
   */
  async onSelectFile(event: SubmitEvent): Promise<void> {
    if (this.selectedFile()?.id === null) {
      await this.new(event);
    } else {
      this.onSelectedFileEvent.emit(this.selectedFile()?.path!);
    }
  }

  /**
   * Add file
   * @param event
   */
  async new(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      if (this.selectedFile()?.id !== null) return;

      await submit(this.fileForm, async (field) => {
        const file = this.loadFile();
        const upload$ =
          file !== null
            ? this._fileService.uploadFile(file, false)
            : of<ResponseI<FileUploadI> | null>(null);

        await firstValueFrom(
          upload$.pipe(
            switchMap((response) => {
              if (response?.message?.path) {
                const selectedFile = this.selectedFile();
                const { name, description } = this.fileModel();
                if (selectedFile) {
                  this.selectedFile.set({
                    ...selectedFile,
                    path: response.message.path,
                    name,
                    description,
                    filename: response.message.filename,
                    mimeType: response.message.mimetype,
                    size: response.message.size,
                  });
                }
              }
              return this._fileManagerService.create(this.selectedFile()!);
            }),
            takeUntilDestroyed(this._destroyRef),
          ),
        );
        this.onSelectedFileEvent.emit(this.selectedFile()?.path!);
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible cargar el archivo.',
        'Error al cargar',
      );
    }
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
