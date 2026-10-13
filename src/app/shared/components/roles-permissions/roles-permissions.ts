import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, required } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { DialogService, UserService } from '@core/services';
import { PageI, RoleT, SitieRolesI, UserI } from '@core/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { PaginationResquestI, TableRoleSearchI } from '@shared/interfaces';
import { TooltipDirective } from '@shared/directives';
import { RoleService } from '@shared/services';
import { PermissionComponent } from '..';
import { debounceTime, take } from 'rxjs';

@Component({
  selector: 'roles-permissions-component',
  templateUrl: './roles-permissions.html',
  imports: [FormField, NgClass, PermissionComponent, TooltipDirective],
})
export class RolesPermissionsComponent {
  tableSearchModel = signal<TableRoleSearchI>({
    search: '',
    filter: '',
    role: null,
    asignRole: 'admin',
    users: [],
  });
  users = signal<UserI[]>([]);
  showFindUser = signal<boolean>(false);
  asignedUsers = signal<SitieRolesI[]>([
    {
      id: 1,
      firstname: 'Juan Mario',
      lastname: 'Garcia Lara',
      email: 'juan.garcia@example.com',
      role: 'review',
      roleName: 'Revisor',
    },
    {
      id: 2,
      firstname: 'María Fernanda',
      lastname: 'López Torres',
      email: 'maria.lopez@example.com',
      role: 'design',
      roleName: 'Diseñador',
    },
    {
      id: 3,
      firstname: 'Carlos Andrés',
      lastname: 'Mendoza Ruiz',
      email: 'carlos.mendoza@example.com',
      role: 'admin',
      roleName: 'Administrador',
    },
    {
      id: 4,
      firstname: 'Ana Gabriela',
      lastname: 'Castro Vega',
      email: 'ana.castro@example.com',
      role: 'editor',
      roleName: 'Editor',
    },
    {
      id: 5,
      firstname: 'José Miguel',
      lastname: 'Ramírez Flores',
      email: 'jose.ramirez@example.com',
      role: 'editor',
      roleName: 'Editor',
    },
    {
      id: 6,
      firstname: 'Daniela Isabel',
      lastname: 'Morales Sánchez',
      email: 'daniela.morales@example.com',
      role: 'design',
      roleName: 'Diseñador',
    },
    {
      id: 7,
      firstname: 'Andrés Felipe',
      lastname: 'Vargas Molina',
      email: 'andres.vargas@example.com',
      role: 'review',
      roleName: 'Revisor',
    },
    {
      id: 8,
      firstname: 'Valentina',
      lastname: 'Paredes Cevallos',
      email: 'valentina.paredes@example.com',
      role: 'editor',
      roleName: 'Editor',
    },
    {
      id: 9,
      firstname: 'Diego Alejandro',
      lastname: 'Herrera Ortiz',
      email: 'diego.herrera@example.com',
      role: 'admin',
      roleName: 'Administrador',
    },
    {
      id: 10,
      firstname: 'Camila Alejandra',
      lastname: 'Navarro Ruiz',
      email: 'camila.navarro@example.com',
      role: 'design',
      roleName: 'Diseñador',
    },
    {
      id: 11,
      firstname: 'Santiago',
      lastname: 'Vásquez Almeida',
      email: 'santiago.vasquez@example.com',
      role: 'review',
      roleName: 'Revisor',
    },
    {
      id: 12,
      firstname: 'Isabella',
      lastname: 'Romero Castillo',
      email: 'isabella.romero@example.com',
      role: 'editor',
      roleName: 'Editor',
    },
    {
      id: 13,
      firstname: 'Mateo Sebastián',
      lastname: 'Jiménez Ponce',
      email: 'mateo.jimenez@example.com',
      role: 'design',
      roleName: 'Diseñador',
    },
    {
      id: 14,
      firstname: 'Sofía Alejandra',
      lastname: 'Acosta Benítez',
      email: 'sofia.acosta@example.com',
      role: 'admin',
      roleName: 'Administrador',
    },
    {
      id: 15,
      firstname: 'Gabriel Antonio',
      lastname: 'Cárdenas Silva',
      email: 'gabriel.cardenas@example.com',
      role: 'review',
      roleName: 'Revisor',
    },
    {
      id: 16,
      firstname: 'Paola Cristina',
      lastname: 'Espinoza Mora',
      email: 'paola.espinoza@example.com',
      role: 'editor',
      roleName: 'Editor',
    },
    {
      id: 17,
      firstname: 'Ricardo Javier',
      lastname: 'Salazar León',
      email: 'ricardo.salazar@example.com',
      role: 'design',
      roleName: 'Diseñador',
    },
    {
      id: 18,
      firstname: 'Gabriela Nicole',
      lastname: 'Ortega Zambrano',
      email: 'gabriela.ortega@example.com',
      role: 'review',
      roleName: 'Revisor',
    },
    {
      id: 19,
      firstname: 'Fernando David',
      lastname: 'Cabrera Hidalgo',
      email: 'fernando.cabrera@example.com',
      role: 'admin',
      roleName: 'Administrador',
    },
    {
      id: 20,
      firstname: 'Lucía Belén',
      lastname: 'Mendoza Córdova',
      email: 'lucia.mendoza@example.com',
      role: 'editor',
      roleName: 'Editor',
    },
  ]);
  asignedUsersFilter = signal<SitieRolesI[]>([]);

  tableSearchForm = form(this.tableSearchModel, (schemaPath) => {
    required(schemaPath.users);
  });

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
    this.asignedUsersFilter.set(this.asignedUsers());

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
          this.users.set(
            res.message.records.filter((user) => user.roleId === this.selectedRole()?.id),
          );
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
    const asignedUsers = this.asignedUsers();
    const filteredAsignedUsers = asignedUsers.filter((user) => {
      const matchesFilter = [user.firstname, user.lastname, user.email].some((value) =>
        value.toLowerCase().includes(filter.trim().toLowerCase()),
      );
      const matchesRole = role === null || user.role === role;
      return matchesFilter && matchesRole;
    });
    this.asignedUsersFilter.set(filteredAsignedUsers);
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
    this.tableSearchModel.update((prev) => ({ ...prev, search: '' }));
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
  removeUser(user: SitieRolesI) {}

  /**
   *  Confirm asign users
   */
  confirmAsign() {
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
      .subscribe((result) => {});
  }

  /**
   *  Confirm remove users
   * @param user
   */
  confirmRemoveUser(user: SitieRolesI) {
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
      .subscribe((result) => {
        if (result) this.removeUser(user);
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
