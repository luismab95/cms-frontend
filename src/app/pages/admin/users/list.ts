import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NgClass, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { UserI } from '@core/interfaces';
import { UserService } from '@core/services';
import { PaginationComponent, PermissionComponent, TitleHeaderComponent } from '@shared/components';
import { PaginationResquestI, TableSearchI } from '@shared/interfaces';
import { RoleService } from '@shared/services';
import { PermissionCode, validAction } from '@shared/utils';
import { UsersDetailsComponent } from './details/details';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'users-list',
  templateUrl: './list.html',
  imports: [
    PaginationComponent,
    PermissionComponent,
    UsersDetailsComponent,
    NgClass,
    TitleCasePipe,
    UpperCasePipe,
    TitleHeaderComponent,
    FormField,
  ],
})
export class UsersList {
  limit = signal<number>(10);
  showDetails = signal<boolean>(false);
  selectedUser = signal<UserI | null>(null);
  tableSearchModel = signal<TableSearchI>({
    search: '',
    status: null,
  });

  tableSearchForm = form(this.tableSearchModel);

  private readonly _userService = inject(UserService);
  private readonly _roleService = inject(RoleService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly users = this._userService.users;
  readonly roles = this._roleService.roles;

  readonly totalUser = computed(() => this.users().total);

  /**
   * Constructor
   */
  constructor() {
    toObservable(this.tableSearchForm.search().value)
      .pipe(debounceTime(600), takeUntilDestroyed(this._destroyRef))
      .subscribe((search) => {
        if (search) this.getAll(1, search === '' ? null : search, this.tableSearchModel().status);
      });

    toObservable(this.tableSearchForm.status().value)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((status) => {
        this.getAll(
          1,
          this.tableSearchModel().search === '' ? null : this.tableSearchModel().search,
          status,
        );
      });
  }

  /**
   * Get all
   * @param page
   * @param search
   * @param status
   */
  getAll(page: number, search: string | null = null, status: boolean | null = null) {
    const params: PaginationResquestI = {
      page,
      limit: this.limit(),
      search,
      status,
    };
    this._userService
      .getAll(params)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        error: (response) => {
          this._toastrService.error(response.error.message, 'Aviso');
        },
      });
  }

  /**
   * Open modal laguanges detail
   *
   * @param data
   */
  openDetailsModal(user: UserI | null): void {
    this.selectedUser.set(user);
    this.showDetails.set(true);
  }

  /**
   * Valid render permission
   * @returns
   */
  validPermission(code: string): boolean {
    return validAction(code);
  }

  /**
   * GetRole
   * @param roleId
   * @returns
   */
  getRole(roleId: number): string {
    const roles = this.roles();
    return roles.find((role) => role.id === roleId)?.name || '';
  }

  /**
   * On Page change
   * @param page
   */
  onPageChange(page: number): void {
    this.getAll(
      page,
      this.tableSearchModel().search === '' ? null : this.tableSearchModel().search,
      this.tableSearchModel().status,
    );
  }

  /**
   * On limit change
   * @param limit
   */
  onLimitChange(limit: number): void {
    this.limit.set(limit);
    this.getAll(
      1,
      this.tableSearchModel().search === '' ? null : this.tableSearchModel().search,
      this.tableSearchModel().status,
    );
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.tableSearchModel.update((prev) => ({ ...prev, search: '' }));
    this.getAll(1, null, this.tableSearchModel().status);
  }

  /**
   * Close modal
   * @param load
   */
  closeModal(load: boolean) {
    this.selectedUser.set(null);
    this.showDetails.set(false);
    if (load) this.onChangeStatus(null);
  }

  /**
   * Change status
   * @param status
   */
  onChangeStatus(status: boolean | null) {
    this.tableSearchModel.update((prev) => ({ ...prev, status }));
    this.onPageChange(1);
  }
}
