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
import { FormsModule } from '@angular/forms';
import { form, submit } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { LogosParameterFormI, ParameterI } from '@core/interfaces';
import { ParameterService, FileService } from '@core/services';
import { findParameter, hasErrorFormField } from '@shared/utils';
import { firstValueFrom, forkJoin, map, Observable } from 'rxjs';

@Component({
  selector: 'parameters-logos',
  templateUrl: './logos.html',
  imports: [FormsModule],
})
export class ParametersLogosComponent {
  parameters = input.required<ParameterI[]>();
  edit = input.required<boolean>();
  refreshParameters = output<boolean>();

  fileAuthBackground = signal<File | null>(null);
  fileIcon = signal<File | null>(null);
  filePrimary = signal<File | null>(null);
  fileEmail = signal<File | null>(null);
  logosModel = signal<LogosParameterFormI>({
    email: '',
    icon: '',
    primary: '',
    authBackground: '',
  });

  logoForm = form(this.logosModel);

  private readonly _parameterService = inject(ParameterService);
  private readonly _fileService = inject(FileService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;

  readonly authBackgroundUrl = computed(() =>
    this.getFileUrl('authBackground', this.fileAuthBackground()),
  );
  readonly iconUrl = computed(() => this.getFileUrl('icon', this.fileIcon()));
  readonly primaryUrl = computed(() => this.getFileUrl('primary', this.filePrimary()));
  readonly emailUrl = computed(() => this.getFileUrl('email', this.fileEmail()));

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      this.parameters();
      const logosParameters = this.getCompanyParameters();
      this.logosModel.set(logosParameters);
    });
  }

  /**
   * Get parameter
   * @param code
   */
  getParameter(code: string) {
    if (this.parameters().length > 0) return findParameter(code, this.parameters())!.value;
    return '';
  }

  /**
   * Update value
   * @param code
   * @param value
   */
  uploadImage(code: keyof LogosParameterFormI, value: string): void {
    this.logosModel.update((prev) => ({ ...prev, [`${code}`]: value }));
  }

  /**
   * Remove the image on the given note
   * @param event
   * @param code
   */
  removeImage(event: any, code: string) {
    const file: File = event.target.files[0];
    if (!file) return;

    switch (code) {
      case 'authBackground':
        this.fileAuthBackground.set(file);
        break;
      case 'icon':
        this.fileIcon.set(file);
        break;
      case 'primary':
        this.filePrimary.set(file);
        break;
      case 'email':
        this.fileEmail.set(file);
        break;
    }
  }

  /**
   * Get parameters
   * @returns
   */
  getCompanyParameters(): LogosParameterFormI {
    return {
      primary: this.getParameter('LOGO_PRIMARY'),
      icon: this.getParameter('LOGO_ICON'),
      authBackground: this.getParameter('LOGO_AUTH_BACKGROUND'),
      email: this.getParameter('LOGO_MAIL'),
    };
  }

  /**
   * Cancel action
   */
  cancel() {
    const logosParameters = this.getCompanyParameters();
    this.logosModel.set(logosParameters);
    this.fileAuthBackground.set(null);
    this.fileIcon.set(null);
    this.filePrimary.set(null);
    this.fileEmail.set(null);
  }

  /**
   * Update logos parameters
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();

      const uploads: Observable<{ code: string; path: string }>[] = [];
      const files = [
        {
          code: 'authBackground',
          file: this.fileAuthBackground(),
        },
        {
          code: 'icon',
          file: this.fileIcon(),
        },
        {
          code: 'primary',
          file: this.filePrimary(),
        },
        {
          code: 'email',
          file: this.fileEmail(),
        },
      ];
      for (const item of files) {
        if (!item.file) continue;

        uploads.push(
          this._fileService.uploadFile(item.file).pipe(
            map((response) => ({
              code: item.code,
              path: response.message.path,
            })),
          ),
        );
      }

      if (uploads.length > 0) {
        forkJoin(uploads).subscribe({
          next: (responses) => {
            for (const response of responses) {
              const key = response.code as keyof LogosParameterFormI;
              this.logosModel.update((prev) => ({ ...prev, [`${key}`]: response.path }));
            }
          },
          error: (response) => {
            this._toastrService.error(
              response.error?.message || 'No fue posible cargar una de las imágenes.',
              'Error al cargar imágenes',
            );
            return;
          },
        });
      }

      let request = this._parameterService
        .updateMultiple(this.getValueLogosForm())
        .pipe(takeUntilDestroyed(this._destroyRef));

      await submit(this.logoForm, async () => {
        await firstValueFrom(request);
        this._toastrService.success(
          'Los parámetros se actualizaron correctamente.',
          'Parámetros actualizados',
        );
        this.refreshParameters.emit(true);
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar los parámetros.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Get value of logos parameters
   */
  getValueLogosForm(): ParameterI[] {
    const parameters: ParameterI[] = [];
    parameters.push(this.getObjectParameter('LOGO_PRIMARY', 'primary'));
    parameters.push(this.getObjectParameter('LOGO_ICON', 'icon'));
    parameters.push(this.getObjectParameter('LOGO_AUTH_BACKGROUND', 'authBackground'));
    parameters.push(this.getObjectParameter('LOGO_MAIL', 'email'));
    return parameters;
  }

  /**
   * Return parameter
   * @param code
   * @param key
   * @returns
   */
  getObjectParameter(code: string, key: keyof LogosParameterFormI): ParameterI {
    const logosModel = this.logosModel();
    return {
      code,
      value: logosModel[key],
    };
  }

  /**
   * Get url
   * @param key
   * @param file
   * @returns
   */
  private getFileUrl(key: keyof LogosParameterFormI, file: File | null): string {
    if (file) return URL.createObjectURL(file);

    const staticUrl = findParameter('APP_STATICS_URL', this.parameters())?.value;
    const logosModel = this.logosModel();
    const value = logosModel[key];
    return `${staticUrl}/${value}`;
  }
}
