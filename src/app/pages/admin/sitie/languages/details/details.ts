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
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, submit, FormField, required } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { FileUploadI } from '@core/interfaces';
import { ParameterService, FileService, DialogService } from '@core/services';
import { PermissionComponent, ModalComponent } from '@shared/components';
import { LanguageI, ResponseI } from '@shared/interfaces';
import { LanguageService } from '@shared/services';
import { PermissionCode, findParameter, hasErrorFormField, validAction } from '@shared/utils';
import { firstValueFrom, of, switchMap, timeout } from 'rxjs';

@Component({
  selector: 'sitie-languages-details',
  templateUrl: './details.html',
  imports: [PermissionComponent, ModalComponent, FormField, NgClass],
})
export class SitieLanguagesDetailsComponent {
  language = input<LanguageI | null>(null);
  closeModalEvent = output<boolean>();

  urlStatics = signal<string>('');
  selectedFile = signal<File | null>(null);
  languageModel = signal<LanguageI>({
    icon: '',
    lang: '',
    name: '',
    sitieId: 0,
  });

  languageForm = form(this.languageModel, (schemaPath) => {
    required(schemaPath.icon, { message: 'Icono es obligatorio.' });
    required(schemaPath.lang, { message: 'Código es obligatorio.' });
    required(schemaPath.name, { message: 'Nombre es obligatorio.' });
    required(schemaPath.sitieId, { message: 'Sitio es obligatorio.' });
  });

  private readonly _languageService = inject(LanguageService);
  private readonly _fileService = inject(FileService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _dialogService = inject(DialogService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;
  readonly permission = PermissionCode;
  readonly parameters = this._parameterService.publicParameters;

  readonly imageUrl = computed(() => {
    const file = this.selectedFile();
    return file ? URL.createObjectURL(file) : null;
  });

  /**
   * Constructor
   */
  constructor() {
    this.urlStatics.set(findParameter('APP_STATICS_URL', this.parameters())?.value!);

    effect(() => {
      const language = this.language();
      if (!language) return;

      this.languageModel.set(language);
    });
  }

  /**
   * Save event
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    if (this.language()) {
      await this.update(event);
    } else {
      await this.create(event);
    }
  }

  /**
   * Add language
   */
  async create(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.languageForm, async (field) => {
        const file = this.selectedFile();
        const upload$ =
          file !== null
            ? this._fileService.uploadFile(file)
            : of<ResponseI<FileUploadI> | null>(null);

        await firstValueFrom(
          upload$.pipe(
            timeout(10000),
            switchMap((response) => {
              if (response?.message?.path) {
                this.languageModel.update((prev) => ({ ...prev, icon: response.message.path }));
              }
              return this._languageService.create(field().value());
            }),
            takeUntilDestroyed(this._destroyRef),
          ),
        );

        this._toastrService.success('El idioma se creó correctamente.', 'Idioma creado');
        this.closeModal(true);
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible crear el idioma.',
        'Error al crear',
      );
    }
  }

  /**
   * Update language
   */
  async update(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.languageForm, async (field) => {
        const file = this.selectedFile();
        const upload$ =
          file !== null
            ? this._fileService.uploadFile(file)
            : of<ResponseI<FileUploadI> | null>(null);

        await firstValueFrom(
          upload$.pipe(
            switchMap((response) => {
              if (response?.message?.path) {
                this.languageModel.update((prev) => ({ ...prev, icon: response.message.path }));
              }
              return this._languageService.update(this.languageModel().id!, field().value());
            }),
            takeUntilDestroyed(this._destroyRef),
          ),
        );
        this._toastrService.success('El idioma se actualizó correctamente.', 'Idioma actualizado');
        this.closeModal(true);
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar el idioma.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Toggle Status language
   */
  async toggleStatus(): Promise<void> {
    const language = this.language();
    if (!language) return;
    try {
      await submit(this.languageForm, async () => {
        await firstValueFrom(
          this._languageService
            .delete(this.languageModel().id!)
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this.closeModal(true);
        this._toastrService.success(
          `El idioma se ${language.status ? 'inactivo' : 'activo'}  correctamente.`,
          `Idioma  ${language.status ? 'inactivo' : 'activo'}`,
        );
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message ||
          `No fue posible ${language.status ? 'inactivar' : 'activar'} el idioma.`,
        `Error al ${language.status ? 'inactivar' : 'activar'}`,
      );
    }
  }

  /**
   * Toggle status language
   */
  toggleLanguage(): void {
    const language = this.language();
    if (!language) return;

    this._dialogService.setDialogData({
      type: 'warning',
      title: `${language.status ? 'Inactivar' : 'Activar'} idioma  ${language.name} `,
      message: `¿Estás seguro de que deseas <b> ${language.status ? 'inactivar' : 'activar'} </b> este idioma? ${language.status ? 'Esta acción hará que deje de estar disponible para su uso.' : 'Esta acción hará que este disponible para su uso.'}`,
      confirmButton: `Si, ${language.status ? 'Inactivar' : 'Activar'}`,
      cancelButton: 'Cancelar',
    });
    this._dialogService.toggleDialog();
    this._dialogService.actionClick$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(async (result) => {
        if (result) {
          await this.toggleStatus();
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
    this.languageModel.update((prev) => ({ ...prev, icon: 'preview' }));
  }

  /**
   * Close Modal
   */
  closeModal(load: boolean) {
    this.closeModalEvent.emit(load);
  }
}
