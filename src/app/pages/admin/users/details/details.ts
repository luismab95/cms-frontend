import { Component, OnDestroy, OnInit, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { RoleI, UserI } from 'app/core/interfaces/user.interface';
import { DialogService } from 'app/core/services/dialog.service';
import { UserService } from 'app/core/services/user.service';
import { ModalComponent } from 'app/shared/components/modal/modal';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { RoleService } from 'app/shared/services/role.service';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'users-details',
  templateUrl: './details.html',
  imports: [FormsModule, ReactiveFormsModule, ModalComponent, PermissionComponent],
})
export class UsersDetailsComponent implements OnInit, OnDestroy {
  user = input<UserI | null>(null);
  closeModalEvent = output<boolean>();

  userForm!: UntypedFormGroup;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;
  permission = PermissionCode;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _userService = inject(UserService);
  private _roleService = inject(RoleService);
  private _toastrService = inject(ToastrService);
  private _formBuilder = inject(UntypedFormBuilder);
  private _dialogService = inject(DialogService);

  readonly roles = toSignal(this._roleService.roles$, { initialValue: [] });

  readonly isOpen = signal(false);

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
    // Create the user form
    this.userForm = this._formBuilder.group({
      firstname: ['', [Validators.required]],
      lastname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      roleId: ['', Validators.required],
      bloqued: [''],
    });

    if (this.user() !== null) {
      this.userForm.patchValue({ ...this.user() });
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
   * Add user
   */
  newUser() {
    // Return if the form is invalid
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.userForm.disable();

    delete this.userForm.value.bloqued;

    this._userService
      .create(this.userForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.userForm.enable();
          this._toastrService.success('El usuario se creó correctamente.', 'Usuario creado');
          this.closeModal(true);
        },
        error: (response) => {
          this.userForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible crear el usuario.',
            'Error al crear',
          );
        },
      });
  }

  /**
   * Update user
   */
  updateUser() {
    // Return if the form is invalid
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.userForm.disable();

    this._userService
      .update(this.user()?.id!, this.userForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.userForm.enable();
          // Set the alert
          this._toastrService.success(
            'El usuario se actualizó correctamente.',
            'Usuario actualizado',
          );
          this.closeModal(true);
        },
        error: (response) => {
          this.userForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar el usuario.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Delete user
   */
  deleteUser() {
    const user = this.user();
    if (user === null) return;

    // Disable the form
    this.userForm.disable();

    this._userService
      .delete(this.user()?.id!)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          // Re-enable the form
          this.userForm.enable();
          this.closeModal(true);
          this._toastrService.success(
            `El usuario se ${user.status ? 'inactivo' : 'activo'}  correctamente.`,
            `Usuario  ${user.status ? 'inactivo' : 'activo'}`,
          );
        },
        error: (response) => {
          this.userForm.enable();
          this._toastrService.error(
            response.error?.message ||
              `No fue posible ${user.status ? 'inactivar' : 'activar'} el usuario.`,
            `Error al ${user.status ? 'inactivar' : 'activar'}`,
          );
        },
      });
  }

  /**
   * Find role
   * @param roleId
   */
  getRole(roleId: number) {
    const role = this.roles().find((role) => role.id === roleId);
    if (role !== undefined) {
      return role;
    }
    return null;
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

    // Subscribe to the confirmation dialog closed action
    this._dialogService.actionClick$.pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
      if (result) {
        this.deleteUser();
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
    this.userForm.controls['roleId'].setValue(role.id);
    this.isOpen.set(false);
  }

  /**
   * Is selected role
   * @param role
   * @returns
   */
  isSelected(role: RoleI): boolean {
    return this.userForm.controls['roleId'].value === role.id;
  }
}
