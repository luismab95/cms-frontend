import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  isDevMode,
  output,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import {
  email,
  form,
  FormField,
  maxLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { CompanyParameterFormI, ParameterI } from '@core/interfaces';
import { ParameterService } from '@core/services';
import { findParameter, hasErrorFormField } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'parameters-company',
  templateUrl: './company.html',
  imports: [FormField, NgClass],
})
export class ParametersCompanyComponent {
  parameters = input.required<ParameterI[]>();
  edit = input.required<boolean>();
  refreshParameters = output<boolean>();

  companyModel = signal<CompanyParameterFormI>({
    name: '',
    country: '',
    description: '',
    email: '',
    urlStatics: '',
    phone: '',
    website: '',
  });

  companyForm = form(this.companyModel, (schemaPath) => {
    required(schemaPath.name, { message: 'Nombre es obligatorio.' });
    required(schemaPath.country, { message: 'País es obligatorio.' });
    required(schemaPath.description, { message: 'Descripción es obligatorio.' });
    maxLength(schemaPath.description, 255, {
      message: 'Descripción no puede superar los 255 caracteres.',
    });
    required(schemaPath.email, { message: 'Dirección de correo electrónico es obligatorio.' });
    email(schemaPath.email, { message: 'Dirección de correo electrónico no válido.' });
    required(schemaPath.urlStatics, { message: 'Dirección de estáticos es obligatorio.' });
    required(schemaPath.phone, { message: 'Teléfono es obligatorio.' });
    required(schemaPath.website, { message: 'Sitio web es obligatorio.' });
    validate(schemaPath.website, ({ value }) => {
      if (isDevMode()) return;

      const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      if (!regex.test(value())) {
        return {
          kind: 'pattern',
          message: 'Sitio web no válido',
        };
      }
      return;
    });
  });

  private readonly _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      this.parameters();
      const companyParameters = this.getCompanyParameters();
      this.companyModel.set(companyParameters);
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
   * Get parameters
   * @returns
   */
  getCompanyParameters(): CompanyParameterFormI {
    return {
      name: this.getParameter('COMPANY_NAME'),
      description: this.getParameter('COMPANY_DESCRIPTION'),
      website: this.getParameter('COMPANY_WEBSITE'),
      urlStatics: this.getParameter('APP_STATICS_URL'),
      email: this.getParameter('COMPANY_MAIL'),
      phone: this.getParameter('COMPANY_PHONE'),
      country: this.getParameter('COMPANY_COUNTRY'),
    };
  }

  /**
   * Update company parameters
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.companyForm, async () => {
        await firstValueFrom(
          this._parameterService
            .updateMultiple(this.getValueCompanyForm())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
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
   * Get value of company parameters
   */
  getValueCompanyForm(): ParameterI[] {
    const parameters: ParameterI[] = [];
    parameters.push(this.getObjectParameter('COMPANY_NAME', 'name'));
    parameters.push(this.getObjectParameter('COMPANY_DESCRIPTION', 'description'));
    parameters.push(this.getObjectParameter('COMPANY_WEBSITE', 'website'));
    parameters.push(this.getObjectParameter('APP_STATICS_URL', 'urlStatics'));
    parameters.push(this.getObjectParameter('COMPANY_MAIL', 'email'));
    parameters.push(this.getObjectParameter('COMPANY_PHONE', 'phone'));
    parameters.push(this.getObjectParameter('COMPANY_COUNTRY', 'country'));
    return parameters;
  }

  /**
   * Return parameter
   * @param code
   * @param key
   * @returns
   */
  getObjectParameter(code: string, key: keyof CompanyParameterFormI): ParameterI {
    const companyModel = this.companyModel();
    return {
      code,
      value: companyModel[key],
    };
  }

  /**
   * Cancel action
   */
  cancel() {
    const parameters = this.getCompanyParameters();
    this.companyModel.set(parameters);
  }
}
