import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { UserI } from '@core/interfaces';
import { UserService } from '@core/services';
import { hasErrorFormField } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'settings-account',
  templateUrl: './account.html',
  imports: [FormField, NgClass],
})
export class SettingsAccountComponent {
  user = input.required<UserI>();
  edit = input.required<boolean>();

  accountModel = signal<UserI>({
    email: '',
    firstname: '',
    lastname: '',
    roleId: 0,
  });

  accountForm = form(this.accountModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Dirección de correo electrónico es obligatorio.' });
    email(schemaPath.email, { message: 'Dirección de correo electrónico no válido.' });
    required(schemaPath.firstname, { message: 'Nombres es obligatorio.' });
    required(schemaPath.lastname, { message: 'Apellidos es obligatorio.' });
    required(schemaPath.roleId, { message: 'Rol asignado es obligatorio.' });
  });

  private readonly _userService = inject(UserService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly hasError = hasErrorFormField;
  readonly role = this._userService.role;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const user = this.user();
      if (!user) return;

      this.accountModel.set({ ...user, roleId: this.role()!.id });
    });
  }

  /**
   * Update profile
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.accountForm, async (field) => {
        await firstValueFrom(
          this._userService
            .update(this.accountModel().id!, field().value())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._userService.getSession().subscribe();
        this._toastrService.success('El perfil se actualizó correctamente.', 'Perfil actualizado');
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar la configuración del perfil.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Cancel action
   */
  cancel() {
    const user = this.user();
    if (!user) return;
    this.accountModel.set({ ...user, roleId: this.role()!.id });
  }
}
