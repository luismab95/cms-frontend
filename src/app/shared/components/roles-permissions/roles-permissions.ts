import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { DialogService, MicrosityService, SitieService, UserService } from '@core/services';
import { RoleT, UserI } from '@core/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { PaginationResquestI, PermissionSitieI, TableRoleSearchI } from '@shared/interfaces';
import { TooltipDirective } from '@shared/directives';
import { RoleService } from '@shared/services';
import { PermissionComponent } from '..';
import { debounceTime, firstValueFrom, take } from 'rxjs';

@Component({
  selector: 'roles-permissions-component',
  templateUrl: './roles-permissions.html',
  imports: [FormField, NgClass, PermissionComponent, TooltipDirective],
})
export class RolesPermissionsComponent {
  assignedUsers = input.required<PermissionSitieI[]>();
  type = input.required<'sitie' | 'micrositie'>();
  id = input.required<number>();

  tableSearchModel = signal<TableRoleSearchI>({
    search: '',
    filter: '',
    role: null,
    asignRole: 'admin',
    users: [],
  });
  users = signal<UserI[]>([]);
  showFindUser = signal<boolean>(false);
  assignedUsersFilter = signal<PermissionSitieI[]>([]);

  tableSearchForm = form(this.tableSearchModel, (schemaPath) => {
    required(schemaPath.users);
  });

  private readonly _sitieService = inject(SitieService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _roleService = inject(RoleService);
  private readonly _userService = inject(UserService);
  private readonly _dialogService = inject(DialogService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly roles = this._roleService.roles;

  readonly selectedRole = computed(() =>
    this.roles().find((rol) => rol.code === this.tableSearchModel().asignRole),
  );

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const assignedUsers = this.assignedUsers();
      this.assignedUsersFilter.set(assignedUsers);
    });

    toObservable(this.tableSearchForm.search().value)
      .pipe(debounceTime(600), takeUntilDestroyed(this._destroyRef))
      .subscribe((search) => {
        if (search) this.findUser(search);
      });

    toObservable(this.tableSearchForm.asignRole().value)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this.clearSearch();
      });

    toObservable(this.tableSearchForm.filter().value)
      .pipe(debounceTime(600), takeUntilDestroyed(this._destroyRef))
      .subscribe((filter) => {
        if (filter) {
          this.filterAsignUser(filter, this.tableSearchModel().role);
        }
      });

    toObservable(this.tableSearchForm.role().value)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((role) => {
        this.filterAsignUser(this.tableSearchModel().filter, role);
      });
  }

  /**
   * Find User
   * @param search
   */
  findUser(search: string) {
    const params: PaginationResquestI = {
      page: 1,
      limit: 99999,
      search,
      status: true,
    };
    this._userService
      .getAll(params)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => {
          const users = res.message.records.filter(
            (user) => user.roleId === this.selectedRole()?.id,
          );
          const permissionUserIds = new Set(
            this.assignedUsers().map((permission) => permission.userId),
          );
          const usersFiltered: UserI[] = users.filter((user) => !permissionUserIds.has(user.id!));
          this.users.set(usersFiltered);
          this.showFindUser.set(true);
        },
      });
  }

  /**
   * Filter assigned users
   * @param filter
   * @param role
   */
  filterAsignUser(filter: string, role: RoleT | null) {
    const asignedUsers = this.assignedUsers();
    const filteredAsignedUsers = asignedUsers.filter((user) => {
      const matchesFilter = [user.firstname, user.lastname, user.email].some((value) =>
        value.toLowerCase().includes(filter.trim().toLowerCase()),
      );
      const matchesRole = role === null || user.role === role;
      return matchesFilter && matchesRole;
    });
    this.assignedUsersFilter.set(filteredAsignedUsers);
  }

  /**
   * Valid render permission
   * @param code
   * @returns
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.tableSearchModel.update((prev) => ({ ...prev, search: '', users: [] }));
    this.users.set([]);
    this.showFindUser.set(false);
  }

  /**
   * Clear input filter
   */
  clearFilter() {
    this.tableSearchModel.update((prev) => ({ ...prev, filter: '' }));
    this.filterAsignUser('', this.tableSearchModel().role);
  }

  /**
   * Change status
   * @param status
   */
  onChangeStatus(role: RoleT | null) {
    this.tableSearchModel.update((prev) => ({ ...prev, role }));
  }

  /**
   * Remove user
   * @param user
   */
  async removeUser(user: PermissionSitieI) {
    try {
      await submit(this.tableSearchForm, async () => {
        const observable =
          this.type() === 'sitie'
            ? this._sitieService.removeAssigUser(user.id)
            : this._microsityService.removeAssigUser(user.id);
        await firstValueFrom(observable.pipe(takeUntilDestroyed(this._destroyRef)));
        this._toastrService.success(
          `El usuario se removio del ${this.type() === 'sitie' ? 'sitio' : 'micrositio'} correctamente.`,
          'Usuario removido',
        );
        this.refreshData();
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message ||
          `No fue posible remover el usuario del ${this.type() === 'sitie' ? 'sitio' : 'micrositio'}.`,
        'Error al remover',
      );
    }
  }

  /**
   *  Confirm asign users
   */
  confirmAssign() {
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Asignar usuario(s)`,
      message:
        '¿Estás seguro de que deseas asignar los usuarios seleccionados con el rol elegido? Se les otorgarán los permisos correspondientes a dicho rol.',
      confirmButton: 'Si, Asignar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();
    this._dialogService.actionClick$
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe(async (result) => {
        if (result) await this.assignUsers();
      });
  }

  /**
   * Assign users
   * @returns
   */
  async assignUsers(): Promise<void> {
    try {
      await submit(this.tableSearchForm, async (field) => {
        const { users } = field().value();
        const observable =
          this.type() === 'sitie'
            ? this._sitieService.assignUser(this.id(), users)
            : this._microsityService.assignUser(this.id(), users);
        await firstValueFrom(observable.pipe(takeUntilDestroyed(this._destroyRef)));
        this._toastrService.success(
          `Los usuarios se asignaron al ${this.type() === 'sitie' ? 'sitio' : 'micrositio'} correctamente.`,
          'Usuarios asignados',
        );
        this.refreshData();
        this.clearSearch();
      });
    } catch (err: any) {
      this._toastrService.error(
        err.error?.message ||
          `No fue posible asignar usuarios al ${this.type() === 'sitie' ? 'sitio' : 'micrositio'}.`,
        'Error al asignar',
      );
    }
  }

  /**
   * refresh data
   */
  refreshData() {
    if (this.type() === 'sitie') {
      this._sitieService.find().pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
    } else {
      this._microsityService.find(this.id()).pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
    }
  }

  /**
   *  Confirm remove users
   * @param user
   */
  confirmRemoveUser(user: PermissionSitieI) {
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Remover usuario`,
      message:
        '¿Estás seguro de que deseas remover a este usuario? Esta acción revocará sus permisos.',
      confirmButton: 'Si, Remover',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();
    this._dialogService.actionClick$
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe(async (result) => {
        if (result) await this.removeUser(user);
      });
  }

  /**
   * Add/remove checked user
   * @param id
   */
  toggleAsignUser(id: number): void {
    this.tableSearchModel.update((prev) => {
      const isSelected = prev.users.includes(id);
      return {
        ...prev,
        users: isSelected ? prev.users.filter((userId) => userId !== id) : [...prev.users, id],
      };
    });
  }

  /**
   * Clear current selection
   */
  clearSelection() {
    this.tableSearchModel.update((prev) => ({ ...prev, users: [] }));
  }
}
