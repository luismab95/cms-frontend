import { NgClass } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  applyEach,
  email,
  form,
  FormField,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { InitialUserI } from '@core/interfaces';
import { InitializerService, ParameterService } from '@core/services';
import { evaluatePasswordSecurity, findParameter, hasErrorFormField } from '@shared/utils';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'initializer-component',
  templateUrl: './initializer.html',
  imports: [NgClass, FormField],
})
export class InitializerComponent {
  initializer = input.required<boolean>();
  initializerPwd = input.required<boolean>();
  currentStep = signal<number>(1);
  longPwd = signal<number>(8);
  mayusPwd = signal<boolean>(false);
  specialPwd = signal<boolean>(false);
  numberPwd = signal<boolean>(false);
  passwordVisibility = signal<Record<number, boolean>>({});
  passwordConfirmVisibility = signal<Record<number, boolean>>({});
  initializerModel = signal<InitialUserI[]>([]);

  initializerForm = form(this.initializerModel, (path) => {
    applyEach(path, (userPath) => {
      required(userPath.email, {
        message: 'La dirección de correo electrónico es obligatoria.',
      });
      email(userPath.email, {
        message: 'La dirección de correo electrónico no es válida.',
      });
      required(userPath.password, {
        message: 'La nueva contraseña es obligatoria.',
      });
      required(userPath.passwordConfirm, {
        message: 'La confirmación de contraseña es obligatoria.',
      });
      pattern(userPath.password, () => this.validatePassword(), {
        message: 'La contraseña no cumple los requisitos de seguridad.',
      });
      validate(userPath.passwordConfirm, (ctx) => {
        const password = ctx.valueOf(userPath.password);
        const confirmation = ctx.value();

        if (!password || password !== confirmation) {
          return {
            kind: 'mismatch',
            message: 'Las contraseñas no coinciden.',
          };
        }

        return undefined;
      });
    });
  });

  private readonly _initializerService = inject(InitializerService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);

  readonly parameters = this._parameterService.publicParameters;
  readonly initializerData = this._initializerService.initializer;

  readonly evaluatePasswordSecurity = evaluatePasswordSecurity;
  readonly hasError = hasErrorFormField;

  readonly passwordSecurityResults = computed(() =>
    this.initializerModel().map((user) => this.evaluatePasswordSecurity(user.password ?? '')),
  );

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const initializer = this.initializer();
      const initializerPwd = this.initializerPwd();

      if (!initializer) {
        this.currentStep.set(1);
        return;
      }

      if (!initializerPwd) this.currentStep.set(2);
    });

    effect(() => {
      const data = this.initializerData();
      if (!data?.users) return;

      const users = data.users.map((user) => ({ ...user, password: '', passwordConfirm: '' }));
      this.initializerModel.set(users);
    });

    effect(() => {
      const parameters = this.parameters();
      const configuredLength = Number(findParameter('APP_PWD_LONG', parameters)?.value);
      this.longPwd.set(
        Number.isFinite(configuredLength) && configuredLength > 0 ? configuredLength : 8,
      );
      this.mayusPwd.set(findParameter('APP_PWD_MAYUS', parameters)?.value === 'true');
      this.specialPwd.set(findParameter('APP_PWD_SPECIAL', parameters)?.value === 'true');
      this.numberPwd.set(findParameter('APP_PWD_NUMBER', parameters)?.value === 'true');
    });
  }

  /**
   * toggle passwords visibility
   * @param index
   */
  togglePasswordVisibility(index: number): void {
    this.passwordVisibility.update((state) => ({
      ...state,
      [index]: !state[index],
    }));
  }

  /**
   * toggle passwords confirm visibility
   * @param index
   */
  togglePasswordConfirmedVisibility(index: number): void {
    this.passwordConfirmVisibility.update((state) => ({
      ...state,
      [index]: !state[index],
    }));
  }

  /**
   * Validate password
   * @returns
   */
  validatePassword(): RegExp {
    let regex = '^';
    if (this.mayusPwd()) regex += '(?=.*[A-Z])';
    if (this.specialPwd()) regex += '(?=.*[@#$%^&+=])';
    if (this.numberPwd()) regex += '(?=.*\\d)';
    regex += `.{${this.longPwd()},}$`;
    return new RegExp(regex);
  }

  /**
   * Get Errors
   * @param field
   * @returns
   */
  firstErrorMessage(field: FieldTree<unknown> | undefined): string {
    if (typeof field !== 'function') return '';
    return field().errors()[0]?.message ?? '';
  }

  /**
   * Save users
   * @param event
   */
  async saveUsers(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.initializerForm, async (field) => {
        await firstValueFrom(
          this._initializerService
            .saveUsers(field().value())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success(
          'La configuración de usuarios iniciales se establecio correctamente.',
          'Aviso',
        );
        this._initializerService.find().subscribe();
        this._router.navigateByUrl('/auth');
      });
    } catch (err: any) {
      this._toastrService.error(
        err?.error?.message ?? 'Ocurrió un error al configurar las creedenciales de usuarios.',
        'Aviso',
      );
    }
  }
}
