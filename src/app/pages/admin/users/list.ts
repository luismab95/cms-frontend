import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NgClass, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { UserI } from 'app/core/interfaces/user.interface';
import { UserService } from 'app/core/services/user.service';
import { PaginationComponent } from 'app/shared/components/pagination/pagination';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PaginationResquestI } from 'app/shared/interfaces/response.interface';
import { RoleService } from 'app/shared/services/role.service';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { UsersDetailsComponent } from './details/details';
import { TitleHeaderComponent } from 'app/shared/components/title-header/title-header';
import { Subject, takeUntil, debounceTime } from 'rxjs';

@Component({
  selector: 'users-list',
  templateUrl: './list.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    PermissionComponent,
    UsersDetailsComponent,
    NgClass,
    TitleCasePipe,
    UpperCasePipe,
    TitleHeaderComponent,
  ],
})
export class UsersList implements OnInit, OnDestroy {
  limit = signal<number>(10);
  showDetails = signal<boolean>(false);
  selectedUser = signal<UserI | null>(null);

  searchInputControl: UntypedFormControl = new UntypedFormControl();
  statusControl: FormControl<boolean | null> = new FormControl(null);

  permission = PermissionCode;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _userService = inject(UserService);
  private readonly _roleService = inject(RoleService);
  private readonly _toastrService = inject(ToastrService);

  readonly users = toSignal(this._userService.users$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  readonly roles = toSignal(this._roleService.roles$, {
    initialValue: [],
  });

  readonly totalUser = computed(() => this.users().total);

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
    // Subscribe to search input field value changes
    this.searchInputControl.valueChanges
      .pipe(debounceTime(700), takeUntil(this._unsubscribeAll))
      .subscribe((search: string) => {
        if (search) this.getAll(1, search === '' ? null : search, this.statusControl.value);
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((status: boolean | null) => {
        this.getAll(
          1,
          this.searchInputControl.value === '' ? null : this.searchInputControl.value,
          status,
        );
      });
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
   * Get all
   * @param page
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
      .pipe(takeUntil(this._unsubscribeAll))
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
   */
  validPermission(code: string) {
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
      this.searchInputControl.value === '' ? null : this.searchInputControl.value,
      this.statusControl.value,
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
      this.searchInputControl.value === '' ? null : this.searchInputControl.value,
      this.statusControl.value,
    );
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.searchInputControl.reset();
    this.getAll(1, null, this.statusControl.value);
  }

  /**
   * Close modal
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
    this.statusControl.setValue(status);
  }
}
