import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { PageReviewService } from '@core/services';
import {
  PageReviewPaginationResquestI,
  PageReviewStatus,
  ReviewPageDataI,
  TablePageReviewSearchI,
} from '@core/interfaces';
import { PaginationComponent, PermissionComponent, TitleHeaderComponent } from '@shared/components';
import { PermissionCode, validAction } from '@shared/utils';
import { TooltipDirective } from '@shared/directives';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'page-review-list',
  templateUrl: './list.html',
  imports: [
    PaginationComponent,
    PermissionComponent,
    NgClass,
    TitleHeaderComponent,
    TooltipDirective,
    FormField,
  ],
})
export class PageReviewList {
  limit = signal<number>(10);
  tableSearchModel = signal<TablePageReviewSearchI>({
    search: '',
    status: null,
  });

  tableSearchForm = form(this.tableSearchModel);

  private readonly _pageReviewService = inject(PageReviewService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly reviewPages = this._pageReviewService.reviewPages;

  readonly totalReviewPages = computed(() => this.reviewPages().total);

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
  getAll(page: number, search: string | null = null, statusReview: PageReviewStatus | null = null) {
    const params: PageReviewPaginationResquestI = {
      page,
      limit: this.limit(),
      search,
      statusReview,
      status: true,
    };
    this._pageReviewService
      .getAll(params)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        error: (response) => {
          this._toastrService.error(response.error.message, 'Aviso');
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
  onChangeStatus(status: PageReviewStatus | null) {
    this.tableSearchModel.update((prev) => ({ ...prev, status }));
  }

  /**
   * Open review page
   * @param data
   */
  openReviewPage(reviewPage: ReviewPageDataI | null): void {
    this._pageReviewService.reviewPage.set(null);
    this._router.navigateByUrl('/admin/content/review-pages/review', {
      state: {
        id: reviewPage === null ? 0 : reviewPage.id,
      },
    });
  }
}
