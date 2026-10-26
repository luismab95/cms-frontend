import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  PageI,
  PageReviewPaginationResquestI,
  ReviewEntityI,
  ReviewModelI,
  ReviewPageDataI,
} from '@core/interfaces';
import { PaginationResponseI, ResponseI } from '@shared/interfaces';
import { buildQueryParams, DefaultPaginationParams } from '@shared/utils';
import { environment } from 'environments/environment';
import { Observable, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PageReviewService {
  reviewPages =
    signal<PaginationResponseI<ReviewPageDataI[]>>(DefaultPaginationParams<ReviewPageDataI[]>());
  reviewPage = signal<ReviewEntityI | null>(null);

  private readonly prefix = 'ms-cms';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get all pages review
   * @param params
   * @returns
   */
  getAll(
    params: PageReviewPaginationResquestI,
  ): Observable<ResponseI<PaginationResponseI<ReviewPageDataI[]>>> {
    const queryParams = buildQueryParams(params);
    return this._httpClient
      .get<ResponseI<PaginationResponseI<ReviewPageDataI[]>>>(
        `${this.url}/${this.prefix}/reviews/page${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this.reviewPages.set(response.message);
          this.reviewPage.set(null);
        }),
      );
  }

  /**
   * Find page review
   * @param pageId
   * @returns
   */
  find(pageReviewId: number): Observable<ResponseI<ReviewEntityI> | null> {
    if (pageReviewId === 0) {
      this.reviewPage.set(null);
      return of(null);
    }
    return this._httpClient
      .get<ResponseI<ReviewEntityI>>(`${this.url}/${this.prefix}/reviews/page/${pageReviewId}`)
      .pipe(
        tap((response) => {
          this.reviewPage.set(response.message);
        }),
      );
  }

  /**
   * Review the changes in the page
   * @param reviewPageId
   * @param reviewPage
   * @returns
   */
  reviewPageContent(reviewPageId: number, reviewPage: ReviewModelI): Observable<ResponseI<string>> {
    return this._httpClient.patch<ResponseI<string>>(
      `${this.url}/${this.prefix}/reviews/page/${reviewPageId}`,
      { ...reviewPage },
    );
  }
}
