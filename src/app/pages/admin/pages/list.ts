import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { PagePaginationResquestI, PageI } from '@core/interfaces';
import { PageService, MicrosityService, SitieService, UserService } from '@core/services';
import { PaginationComponent, PermissionComponent, TitleHeaderComponent } from '@shared/components';
import { TableSearchI } from '@shared/interfaces';
import { PermissionCode, validAction } from '@shared/utils';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'pages',
  templateUrl: './list.html',
  imports: [PaginationComponent, PermissionComponent, NgClass, TitleHeaderComponent, FormField],
})
export class PagesList {
  limit = signal<number>(10);

  tableSearchModel = signal<TableSearchI>({
    search: '',
    status: null,
  });

  tableSearchForm = form(this.tableSearchModel);

  private readonly _userService = inject(UserService);
  private readonly _sitieService = inject(SitieService);
  private readonly _pageService = inject(PageService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly pages = this._pageService.pages;
  readonly micrositie = this._microsityService.micrositie;
  readonly sitie = this._sitieService.sitie;
  readonly userLogin = this._userService.userLogin;

  readonly totalPage = computed(() => this.pages().total);

  readonly canCreate = computed(() => {
    const micrositie = this.micrositie();
    if (micrositie) return true;

    const sitie = this.sitie();
    if (!sitie) return false;

    const userLogin = this.userLogin();
    if (!userLogin) return false;

    const { id } = userLogin;
    const findPermission = sitie?.permissionSitie?.find((permission) => permission.userId === id);
    if (!findPermission) return false;

    return true;
  });

  /**
   * Constructor
   */
  constructor() {
    this._pageService.page.set(null);
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
    const params: PagePaginationResquestI = {
      page,
      limit: this.limit(),
      micrositieId: this.micrositie() === null ? null : this.micrositie()!.id!,
      search,
      status,
    };
    this._pageService
      .getAll(params)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        error: (response) => {
          this._toastrService.error(response.error.message, 'Aviso');
        },
      });
  }

  /**
   * Open page detail
   * @param data
   */
  openDetailsModal(page: PageI | null): void {
    this._pageService.page.set(null);
    this._router.navigateByUrl('/admin/content/pages/detail', {
      state: {
        id: page === null ? 0 : page.id,
        micrositieId: this.micrositie() === null ? 0 : this.micrositie()!.id!,
      },
    });
  }

  /**
   * Valid render permission
   * @returns
   */
  validPermission(code: string): boolean {
    return validAction(code);
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
   * Change status
   * @param status
   */
  onChangeStatus(status: boolean | null) {
    this.tableSearchModel.update((prev) => ({ ...prev, status }));
    this.onPageChange(1);
  }
}
