import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { email, form, FormField, required, submit } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { UserI, RoleI } from '@core/interfaces';
import { UserService, DialogService } from '@core/services';
import { ModalComponent, PermissionComponent } from '@shared/components';
import { RoleService } from '@shared/services';
import { hasErrorFormField, PermissionCode, validAction } from '@shared/utils';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'users-details',
  templateUrl: './details.html',
  imports: [ModalComponent, PermissionComponent, FormField, NgClass],
})
export class UsersDetailsComponent {
  user = input<UserI | null>(null);
  closeModalEvent = output<boolean>();

  isOpen = signal(false);
  userModel = signal<UserI>({
    email: '',
    firstname: '',
    lastname: '',
    roleId: 0,
  });

  userForm = form(this.userModel, (schemaPath) => {
    required(schemaPath.email, { message: 'Dirección de correo electrónico es obligatorio.' });
    email(schemaPath.email, { message: 'Dirección de correo electrónico no válido.' });
    required(schemaPath.firstname, { message: 'Nombres es obligatorio.' });
    required(schemaPath.lastname, { message: 'Apellidos es obligatorio.' });
    required(schemaPath.roleId, { message: 'Rol asignado es obligatorio.' });
  });

  private readonly _userService = inject(UserService);
  private readonly _roleService = inject(RoleService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _dialogService = inject(DialogService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly hasError = hasErrorFormField;
  readonly roles = this._roleService.roles;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const user = this.user();
      if (!user) return;

      this.userModel.set(user);
    });
  }

  /**
   * Save event
   * @param event
   */
  async save(event: SubmitEvent): Promise<void> {
    if (this.user()) {
      await this.update(event);
    } else {
      await this.create(event);
    }
  }

  /**
   * Add user
   * @param event
   */
  async create(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.userForm, async (field) => {
        await firstValueFrom(
          this._userService.create(field().value()).pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success('El usuario se creó correctamente.', 'Usuario creado');
        this.closeModal(true);
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible crear el usuario.',
        'Error al crear',
      );
    }
  }

  /**
   * Update user
   * @param event
   */
  async update(event: SubmitEvent): Promise<void> {
    try {
      event.preventDefault();
      await submit(this.userForm, async (field) => {
        await firstValueFrom(
          this._userService
            .update(this.userModel().id!, field().value())
            .pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this._toastrService.success(
          'El usuario se actualizó correctamente.',
          'Usuario actualizado',
        );
        this.closeModal(true);
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || 'No fue posible actualizar el usuario.',
        'Error al actualizar',
      );
    }
  }

  /**
   * Toggle status user
   */
  async toggleStatus(): Promise<void> {
    const user = this.user();
    if (!user) return;

    try {
      await submit(this.userForm, async () => {
        await firstValueFrom(
          this._userService.delete(this.userModel().id!).pipe(takeUntilDestroyed(this._destroyRef)),
        );
        this.closeModal(true);
        this._toastrService.success(
          `El usuario se ${user.status ? 'inactivo' : 'activo'}  correctamente.`,
          `Usuario  ${user.status ? 'inactivo' : 'activo'}`,
        );
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message || `No fue posible ${user.status ? 'inactivar' : 'activar'} el usuario.`,
        `Error al ${user.status ? 'inactivar' : 'activar'}`,
      );
    }
  }

  /**
   * Find role
   * @param roleId
   * @returns
   */
  getRole(roleId: number) {
    const role = this.roles().find((role) => role.id === roleId);
    if (!role) return;

    return role;
  }

  /**
   * Toggle the user
   */
  toggleUser(): void {
    const user = this.user();
    if (user === null) return;

    this._dialogService.setDialogData({
      type: 'warning',
      title: `${user.status ? 'Inactivar' : 'Activar'} usuario  ${user.firstname}  ${user.lastname}`,
      message: `¿Estás seguro de que deseas <b> ${user.status ? 'inactivar' : 'activar'} </b> este usuario? ${user.status ? 'Esta acción hará que deje de estar disponible para su uso.' : 'Esta acción hará que este disponible para su uso.'}`,
      confirmButton: `Si, ${user.status ? 'Inactivar' : 'Activar'}`,
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
   * Toggle dropdown role
   */
  toggleDropdown(): void {
    this.isOpen.update((value) => !value);
  }

  /**
   * Select role
   * @param role
   */
  selectRole(role: RoleI): void {
    this.userModel.update((prev) => ({ ...prev, roleId: role.id }));
    this.isOpen.set(false);
  }

  /**
   * Is selected role
   * @param role
   * @returns
   */
  isSelected(role: RoleI): boolean {
    return this.userModel().roleId === role.id;
  }
}
