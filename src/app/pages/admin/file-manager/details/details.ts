import { ClipboardModule } from '@angular/cdk/clipboard';
import { NgClass } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { FileI, FileUploadI } from 'app/core/interfaces/file.interface';
import { DialogService } from 'app/core/services/dialog.service';
import { FileManagerService } from 'app/core/services/file-manager.service';
import { FileService } from 'app/core/services/file.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { ModalComponent } from 'app/shared/components/modal/modal';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { of, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'files-details',
  templateUrl: './details.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ModalComponent,
    PermissionComponent,
    NgClass,
    ClipboardModule,
  ],
})
export class FileManagerDetailsComponent implements OnInit, OnDestroy {
  file = input<FileI | null>(null);
  closeModalEvent = output<boolean>();

  selectedFile = signal<File | null>(null);
  urlStatics = signal<string>('');

  fileForm!: UntypedFormGroup;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;
  permission = PermissionCode;

  imageUrl = computed(() => {
    const file = this.selectedFile();
    return file ? URL.createObjectURL(file) : null;
  });

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _toastrService = inject(ToastrService);
  private _formBuilder = inject(UntypedFormBuilder);
  private _dialogService = inject(DialogService);
  private _fileService = inject(FileService);
  private _fileManagerService = inject(FileManagerService);
  private _parameterService = inject(ParameterService);

  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });

  readonly selectedFileMimeType = computed(() => this.selectedFile()!.type.toLowerCase());

  /**
   * Constructor
   */
  constructor() {
    this.urlStatics.set(findParameter('APP_STATICS_URL', this.parameters())?.value!);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Create the user form
    this.fileForm = this._formBuilder.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      path: ['', [Validators.required]],
      mimeType: ['', [Validators.required]],
      filename: ['', [Validators.required]],
      size: ['', [Validators.required]],
    });

    if (this.file() !== null) {
      this.fileForm.patchValue({ ...this.file() });
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
   * Add file
   */
  new() {
    // Return if the form is invalid
    if (this.fileForm.invalid) {
      this.fileForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.fileForm.disable();

    const file = this.selectedFile();

    const upload$ =
      file !== null
        ? this._fileService.uploadFile(file, false)
        : of<ResponseI<FileUploadI> | null>(null);

    upload$
      .pipe(
        switchMap((response) => {
          if (response?.message?.path) {
            this.fileForm.get('path')?.setValue(response.message.path);
            this.fileForm.get('filename')?.setValue(response.message.filename);
            this.fileForm.get('size')?.setValue(response.message.size);
            this.fileForm.get('mimeType')?.setValue(response.message.mimetype);
          }
          return this._fileManagerService.create(this.fileForm.value);
        }),
        takeUntil(this._unsubscribeAll),
      )
      .subscribe({
        next: () => {
          this.fileForm.enable();
          this._toastrService.success('El archivo se creó correctamente.', 'Archivo creado');
          this.closeModal(true);
        },
        error: (response) => {
          this.fileForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible crear el archivo.',
            'Error al crear',
          );
        },
      });
  }

  /**
   * Update file
   */
  update() {
    // Return if the form is invalid
    if (this.fileForm.invalid) {
      this.fileForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.fileForm.disable();

    this._fileManagerService
      .update(this.file()?.id!, this.fileForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.fileForm.enable();
          // Set the alert
          this._toastrService.success(
            'El archivo se actualizó correctamente.',
            'Archivo actualizado',
          );
          this.closeModal(true);
        },
        error: (response) => {
          this.fileForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar el archivo.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Delete file
   */
  delete() {
    const file = this.file();
    if (file === null) return;

    // Disable the form
    this.fileForm.disable();

    this._fileManagerService
      .delete(this.file()?.id!)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          // Re-enable the form
          this.fileForm.enable();
          this.closeModal(true);
          this._toastrService.success(
            `El archivo se ${file.status ? 'inactivo' : 'activo'}  correctamente.`,
            `Archivo  ${file.status ? 'inactivo' : 'activo'}`,
          );
        },
        error: (response) => {
          this.fileForm.enable();
          this._toastrService.error(
            response.error?.message ||
              `No fue posible ${file.status ? 'inactivar' : 'activar'} el archivo.`,
            `Error al ${file.status ? 'inactivar' : 'activar'}`,
          );
        },
      });
  }

  /**
   * Toggle the file
   */
  toggle(): void {
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

    // Subscribe to the confirmation dialog closed action
    this._dialogService.actionClick$.pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
      if (result) {
        this.delete();
      }
    });
  }

  /**
   * Valid render permission
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   * Close Modal
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
    this.fileForm.get('path')?.setValue('preview');
    this.fileForm.get('filename')?.setValue('preview');
    this.fileForm.get('size')?.setValue('preview');
    this.fileForm.get('mimeType')?.setValue('preview');
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
    this._fileService.downloadFile(this.file()?.url!).subscribe({
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
