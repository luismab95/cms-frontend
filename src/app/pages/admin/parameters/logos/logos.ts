import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { FileService } from 'app/core/services/file.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { forkJoin, map, Observable, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'parameters-logos',
  templateUrl: './logos.html',
  imports: [FormsModule, ReactiveFormsModule],
})
export class ParametersLogosComponent implements OnInit {
  parameters = input.required<ParameterI[]>();
  edit = input.required<boolean>();
  refreshParameters = output<boolean>();

  fileAuthBackground = signal<File | null>(null);
  fileIcon = signal<File | null>(null);
  filePrimary = signal<File | null>(null);
  fileEmail = signal<File | null>(null);

  logoForm!: UntypedFormGroup;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  readonly authBackgroundUrl = computed(() =>
    this.getFileUrl('authBackground', this.fileAuthBackground()),
  );
  readonly iconUrl = computed(() => this.getFileUrl('icon', this.fileIcon()));
  readonly primaryUrl = computed(() => this.getFileUrl('primary', this.filePrimary()));
  readonly emailUrl = computed(() => this.getFileUrl('email', this.fileEmail()));

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _parameterService = inject(ParameterService);
  private readonly _fileService = inject(FileService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _formBuilder = inject(UntypedFormBuilder);

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
    // Create the form
    this.logoForm = this._formBuilder.group({
      primary: [''],
      secondary: [''],
      icon: [''],
      email: [''],
      authBackground: [''],
    });

    this.logoForm.patchValue({ ...this.getCompanyParameters() });
    if (!this.edit()) this.logoForm.disable();
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
   * Get parameter
   * @param code
   */
  getParameter(code: string) {
    if (this.parameters().length > 0) {
      return findParameter(code, this.parameters())!.value;
    }

    return '';
  }

  /**
   * Update value
   * @param code
   * @param value
   */
  uploadImage(code: string, value: string): void {
    this.logoForm.get(code)?.setValue(value);
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
  getCompanyParameters() {
    return {
      primary: this.getParameter('LOGO_PRIMARY'),
      secondary: this.getParameter('LOGO_SECONDARY'),
      icon: this.getParameter('LOGO_ICON'),
      authBackground: this.getParameter('LOGO_AUTH_BACKGROUND'),
      email: this.getParameter('LOGO_MAIL'),
    };
  }

  /**
   * Cancel action
   */
  cancel() {
    this.logoForm.reset();
    this.logoForm.patchValue({ ...this.getCompanyParameters() });
    this.fileAuthBackground.set(null);
    this.fileIcon.set(null);
    this.filePrimary.set(null);
    this.fileEmail.set(null);
  }

  /**
   * Save action
   */
  save() {
    // Return if the form is invalid
    if (this.logoForm.invalid) {
      this.logoForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.logoForm.disable();

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
      if (!item.file) {
        continue;
      }

      uploads.push(
        this._fileService.uploadFile(item.file).pipe(
          map((response) => ({
            code: item.code,
            path: response.message.path,
          })),
        ),
      );
    }

    // No hay archivos nuevos
    if (uploads.length === 0) {
      this.updateParameters();
      return;
    }

    // Esperar a que terminen todas las cargas
    forkJoin(uploads).subscribe({
      next: (responses) => {
        for (const response of responses) {
          this.logoForm.get(response.code)?.setValue(response.path);
        }
        this.updateParameters();
      },
      error: (response) => {
        this._toastrService.error(
          response.error?.message || 'No fue posible cargar una de las imágenes.',
          'Error al cargar imágenes',
        );
      },
    });
  }

  /**
   * Get value of logos parameters
   */
  getValueLogosForm(): ParameterI[] {
    const parameters: ParameterI[] = [];
    parameters.push(this.getObjectParameter('LOGO_PRIMARY', 'primary'));
    parameters.push(this.getObjectParameter('LOGO_SECONDARY', 'secondary'));
    parameters.push(this.getObjectParameter('LOGO_ICON', 'icon'));
    parameters.push(this.getObjectParameter('LOGO_AUTH_BACKGROUND', 'authBackground'));
    parameters.push(this.getObjectParameter('LOGO_MAIL', 'email'));
    return parameters;
  }

  /**
   * Return parameter
   * @param code
   * @param value
   * @returns
   */
  getObjectParameter(code: string, value: string): ParameterI {
    return {
      code,
      value: this.logoForm.get(value)?.value,
    };
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get url
   * @param code
   * @param file
   * @returns
   */
  private getFileUrl(code: string, file: File | null): string {
    if (file) {
      return URL.createObjectURL(file);
    }
    const staticUrl = findParameter('APP_STATICS_URL', this.parameters())?.value;
    const value = this.logoForm.get(code)?.value;
    return `${staticUrl}/${value}`;
  }

  /**
   * Update parameters
   */
  private updateParameters(): void {
    this._parameterService
      .updateMultiple(this.getValueLogosForm())
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.logoForm.enable();
          this._toastrService.success(
            'Los parámetros se actualizaron correctamente.',
            'Parámetros actualizados',
          );
          this.refreshParameters.emit(true);
        },
        error: (response) => {
          this.logoForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar los parámetros.',
            'Error al actualizar',
          );
        },
      });
  }
}
