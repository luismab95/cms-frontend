import { ClipboardModule } from '@angular/cdk/clipboard';
import { NgClass } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { FileI, FileUploadI } from '@core/interfaces';
import { DialogService, FileService, FileManagerService, ParameterService } from '@core/services';
import { ModalComponent, PermissionComponent } from '@shared/components';
import { ResponseI } from '@shared/interfaces';
import { PermissionCode, findParameter, hasErrorFormField, validAction } from '@shared/utils';
import { firstValueFrom, of, switchMap } from 'rxjs';

@Component({
  selector: 'files-details',
  templateUrl: './details.html',
  imports: [ModalComponent, PermissionComponent, NgClass, FormField, ClipboardModule],
})
export class FileManagerDetailsComponent {
  file = input<FileI | null>(null);
  closeModalEvent = output<boolean>();

  selectedFile = signal<File | null>(null);
  fileModel = signal<FileI>({
    name: '',
    description: '',
    path: '',
    mimeType: '',
    filename: '',
    size: 0,
  });

  fileForm = form(this.fileModel, (schemaPath) => {
    required(schemaPath.name!, { message: 'Nombre es obligatorio.' });
    required(schemaPath.description, { message: 'Descripción es obligatorio.' });
    maxLength(schemaPath.description, 255, {
      message: 'Descripción no puede superar los 255 caracteres.',
    });
    required(schemaPath.path, { message: 'Imagen es obligatorio.' });
  });

  private _fileManagerService = inject(FileManagerService);
  private _parameterService = inject(ParameterService);
  private _fileService = inject(FileService);
  private _toastrService = inject(ToastrService);
  private _dialogService = inject(DialogService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly parameters = this._parameterService.publicParameters;
  readonly permission = PermissionCode;
  readonly hasError = hasErrorFormField;

  readonly selectedFileMimeType = computed(() => this.selectedFile()!.type.toLowerCase());
  readonly imageUrl = computed(() => {
    const file = this.selectedFile();
    return file ? URL.createObjectURL(file) : null;
  });
  readonly urlStatics = computed(() => {
    return findParameter('APP_STATICS_URL', this.parameters())?.value!;
  });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const file = this.file();
      if (!file) return;

      this.fileModel.set(file);
    });
  }

  /**
   * Save event
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    if (this.file()) {
      await this.update(event);
    } else {
      await this.create(event);
    }
  }

  /**
   * Add file
   * @param event
   */
  async create(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.fileForm, async (field) => {
        const file = this.selectedFile();
        const upload$ =
          file !== null
            ? this._fileService.uploadFile(file, false)
            : of<ResponseI<FileUploadI> | null>(null);

        await firstValueFrom(
          upload$.pipe(
            switchMap((response) => {
              if (response?.message?.path) {
                const { path, filename, size, mimetype } = response.message;
                this.fileModel.update((prev) => ({ ...prev, path, filename, size, mimetype }));
              }
              return this._fileManagerService.create(field().value());
            }),
            takeUntilDestroyed(this._destroyRef),
          ),
        );
        this._toastrService.success('El archivo se creó correctamente.', 'Archivo creado');
        this.closeModal(true);
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible cargar el archivo.',
        'Error al cargar',
      );
    }
  }

  /**
   * Update file
   * @param event
   */
  async update(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.fileForm, async (field) => {
        await firstValueFrom(
          this._fileManagerService
            .update(this.fileModel().id!, field().value())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success(
          'El archivo se actualizó correctamente.',
          'Archivo actualizado',
        );
        this.closeModal(true);
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar el archivo.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Toggle status file
   */
  async toggleStatus(): Promise<void> {
    const file = this.file();
    if (file === null) return;

    try {
      await submit(this.fileForm, async () => {
        await firstValueFrom(
          this._fileManagerService
            .delete(this.fileModel().id!)
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this.closeModal(true);
        this._toastrService.success(
          `El archivo se ${file.status ? 'inactivo' : 'activo'}  correctamente.`,
          `Archivo  ${file.status ? 'inactivo' : 'activo'}`,
        );
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || `No fue posible ${file.status ? 'inactivar' : 'activar'} el archivo.`,
        `Error al ${file.status ? 'inactivar' : 'activar'}`,
      );
    }
  }

  /**
   * Toggle the file
   */
  toggleFile(): void {
    const file = this.file();
    if (file === null) return;

    this._dialogService.setDialogData({
      type: 'warning',
      title: `${file.status ? 'Inactivar' : 'Activar'} archivo  ${file.name}`,
      message: `¿Estás seguro de que deseas <b> ${file.status ? 'inactivar' : 'activar'} </b> este archivo? ${file.status ? 'Esta acción hará que deje de estar disponible para su uso.' : 'Esta acción hará que este disponible para su uso.'}`,
      confirmButton: `Si, ${file.status ? 'Inactivar' : 'Activar'}`,
      cancelButton: 'Cancelar',
    });
    this._dialogService.toggleDialog();
    this._dialogService.actionClick$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          this.toggleStatus();
        }
      });
  }

  /**
   * Valid render permission
   * @returns
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   * Close Modal
   * @param load
   */
  closeModal(load: boolean) {
    this.closeModalEvent.emit(load);
  }

  /**
   * set file to save
   * @param event
   */
  setFile(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.selectedFile.set(file);
    this.fileModel.update((prev) => ({
      ...prev,
      path: 'preview',
      filename: 'preview',
      size: 0,
      mimeType: 'preview',
    }));
  }

  /**
   * Get icon
   * @returns
   */
  getICon(icon: string) {
    return `${this.urlStatics()}/${icon}`;
  }

  /**
   * Download file
   */
  downloadFile() {
    this._fileService
      .downloadFile(this.file()?.url!)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (response) => {
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(response);
          link.download = this.file()?.filename!;
          link.click();
        },
        error: (response) => {
          this._toastrService.error(
            response.error?.message || `No fue posible descargar el archivo.`,
            'Error al descargar',
          );
        },
      });
  }

  /**
   * Copy url to clipboard
   */
  copyEvent(): void {
    this._toastrService.info('URL copiada al portapapeles', 'Aviso');
  }
}
