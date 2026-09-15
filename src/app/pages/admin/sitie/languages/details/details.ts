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
import { DialogService } from 'app/core/services/dialog.service';
import { FileService } from 'app/core/services/file.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { SitieService } from 'app/core/services/sitie.service';
import { ModalComponent } from 'app/shared/components/modal/modal';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { LanguageI } from 'app/shared/interfaces/language.interfaces';
import { LanguageService } from 'app/shared/services/language.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { switchMap, takeUntil } from 'rxjs/operators';
import { Subject, of } from 'rxjs';
import { FileUploadI } from 'app/core/interfaces/file.interface';
import { ResponseI } from 'app/shared/interfaces/response.interface';

@Component({
  selector: 'sitie-languages-details',
  templateUrl: './details.html',
  imports: [FormsModule, ReactiveFormsModule, PermissionComponent, ModalComponent],
})
export class SitieLanguagesDetailsComponent implements OnInit, OnDestroy {
  language = input<LanguageI | null>(null);
  closeModalEvent = output<boolean>();

  urlStatics = signal<string>('');
  selectedFile = signal<File | null>(null);

  languageForm!: UntypedFormGroup;
  permission = PermissionCode;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  imageUrl = computed(() => {
    const file = this.selectedFile();
    return file ? URL.createObjectURL(file) : null;
  });

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _parameterService = inject(ParameterService);
  private _fileService = inject(FileService);
  private _languageService = inject(LanguageService);
  private _sitieService = inject(SitieService);
  private _toastrService = inject(ToastrService);
  private _formBuilder = inject(UntypedFormBuilder);
  private _dialogService = inject(DialogService);

  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });
  readonly sitie = toSignal(this._sitieService.sitie$, { initialValue: null });

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
    // Create the language form
    this.languageForm = this._formBuilder.group({
      name: ['', [Validators.required]],
      lang: ['', [Validators.required]],
      icon: ['', [Validators.required]],
      sitieId: ['', [Validators.required]],
    });
    if (this.language() !== null) {
      this.languageForm.patchValue({ ...this.language() });
    } else {
      this.languageForm.get('sitieId')?.setValue(this.sitie()!.id);
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
   * Add language
   */
  create() {
    // Return if the form is invalid
    if (this.languageForm.invalid) {
      this.languageForm.markAllAsTouched();
      return;
    }

    const file = this.selectedFile();

    this.languageForm.disable();

    const upload$ =
      file !== null ? this._fileService.uploadFile(file) : of<ResponseI<FileUploadI> | null>(null);

    upload$
      .pipe(
        switchMap((response) => {
          if (response?.message?.path) {
            this.languageForm.get('icon')?.setValue(response.message.path);
          }
          return this._languageService.create(this.languageForm.value);
        }),
        takeUntil(this._unsubscribeAll),
      )
      .subscribe({
        next: () => {
          this.languageForm.enable();
          this._toastrService.success('El idioma se creó correctamente.', 'Idioma creado');
          this.closeModal(true);
        },
        error: (response) => {
          this.languageForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible crear el idioma.',
            'Error al crear',
          );
        },
      });
  }

  /**
   * Update language
   */
  update() {
    // Return if the form is invalid
    if (this.languageForm.invalid) {
      this.languageForm.markAllAsTouched();
      return;
    }

    const file = this.selectedFile();

    // Disable the form
    this.languageForm.disable();

    const upload$ =
      file !== null ? this._fileService.uploadFile(file) : of<ResponseI<FileUploadI> | null>(null);

    upload$
      .pipe(
        switchMap((response) => {
          if (response?.message?.path) {
            this.languageForm.get('icon')?.setValue(response.message.path);
          }
          return this._languageService.update(this.language()!.id!, this.languageForm.value);
        }),
        takeUntil(this._unsubscribeAll),
      )
      .subscribe({
        next: () => {
          this.languageForm.enable();

          this._toastrService.success(
            'El idioma se actualizó correctamente.',
            'Idioma actualizado',
          );
          this.closeModal(true);
        },
        error: (response) => {
          this.languageForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar el idioma.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Delete language
   */
  delete() {
    const language = this.language();
    if (language === null) return;

    // Disable the form
    this.languageForm.disable();

    this._languageService
      .delete(this.language()!.id!)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.languageForm.enable();
          this.closeModal(true);
          this._toastrService.success(
            `El idioma se ${language.status ? 'inactivo' : 'activo'}  correctamente.`,
            `Idioma  ${language.status ? 'inactivo' : 'activo'}`,
          );
        },
        error: (response) => {
          this.languageForm.enable();

          this._toastrService.error(
            response.error?.message ||
              `No fue posible ${language.status ? 'inactivar' : 'activar'} el idioma.`,
            `Error al ${language.status ? 'inactivar' : 'activar'}`,
          );
        },
      });
  }

  /**
   * Toggle status language
   */
  toggleLanguage(): void {
    const language = this.language();
    if (language === null) return;

    this._dialogService.setDialogData({
      type: 'warning',
      title: `${language.status ? 'Inactivar' : 'Activar'} idioma  ${language.name} `,
      message: `¿Estás seguro de que deseas <b> ${language.status ? 'inactivar' : 'activar'} </b> este idioma? ${language.status ? 'Esta acción hará que deje de estar disponible para su uso.' : 'Esta acción hará que este disponible para su uso.'}`,
      confirmButton: `Si, ${language.status ? 'Inactivar' : 'Activar'}`,
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
   * Get icon
   * @returns
   */
  getICon(icon: string) {
    return `${this.urlStatics()}/${icon}`;
  }

  /**
   * set file to save
   * @param event
   */
  setFile(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    this.selectedFile.set(file);
    this.languageForm.get('icon')?.setValue('preview');
  }

  /**
   * Close Modal
   */
  closeModal(load: boolean) {
    this.closeModalEvent.emit(load);
  }
}
