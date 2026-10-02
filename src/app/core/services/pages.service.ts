import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { buildQueryParams, buildQueryParamsPage, DefaultPaginationParams } from '@shared/utils';
import { PageI, PagePaginationResquestI, GetPageI, PageRenderI } from '@core/interfaces';
import { PaginationResponseI, ResponseI } from '@shared/interfaces';
import { environment } from 'environments/environment';
import { Observable, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PageService {
  pages = signal<PaginationResponseI<PageI[]>>(DefaultPaginationParams<PageI[]>());
  page = signal<PageI | null>(null);

  private readonly prefix = 'ms-cms';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get all pages
   * @param params
   * @returns
   */
  getAll(params: PagePaginationResquestI): Observable<ResponseI<PaginationResponseI<PageI[]>>> {
    const queryParams = buildQueryParams(params);
    return this._httpClient
      .get<ResponseI<PaginationResponseI<PageI[]>>>(
        `${this.url}/${this.prefix}/pages${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this.pages.set(response.message);
        }),
      );
  }

  /**
   * Find page
   * @param pageId
   * @returns
   */
  find(pageId: number): Observable<ResponseI<PageI> | null> {
    if (pageId === 0) {
      this.page.set(null);
      return of(null);
    }
    return this._httpClient
      .get<ResponseI<PageI>>(`${this.url}/${this.prefix}/pages/${pageId}`)
      .pipe(
        tap((response) => {
          this.page.set(response.message);
        }),
      );
  }

  /**
   * Create the page
   * @param page
   * @returns
   */
  create(page: PageI): Observable<ResponseI<PageI>> {
    return this._httpClient
      .post<ResponseI<PageI>>(`${this.url}/${this.prefix}/pages`, { ...page })
      .pipe(
        tap((response) => {
          this.page.set(response.message);
        }),
      );
  }

  /**
   * Delete the page
   * @param pageId
   * @returns
   */
  delete(pageId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(`${this.url}/${this.prefix}/pages/${pageId}`);
  }

  /**
   * Save the page draft
   * @param pageId
   * @param page
   * @returns
   */
  saveDraft(pageId: number, page: PageI): Observable<ResponseI<string>> {
    return this._httpClient.patch<ResponseI<string>>(
      `${this.url}/${this.prefix}/pages/draft/${pageId}`,
      {
        ...page,
      },
    );
  }

  /**
   * Delete draft page
   * @param pageId
   * @returns
   */
  deleteDraft(pageId: number): Observable<ResponseI<PageI>> {
    return this._httpClient
      .delete<ResponseI<PageI>>(`${this.url}/${this.prefix}/pages/draft/${pageId}`)
      .pipe(
        tap((response) => {
          this.page.set(response.message);
        }),
      );
  }

  /**
   * Update the page
   *
   * @param pageId
   * @param page
   * @returns
   */
  update(pageId: number, page: PageI): Observable<ResponseI<PageI>> {
    return this._httpClient
      .patch<ResponseI<PageI>>(`${this.url}/${this.prefix}/pages/${pageId}`, page)
      .pipe(
        tap((response) => {
          this.page.set(response.message);
        }),
      );
  }

  /**
   * Get  page for render
   * @param params
   * @returns
   */
  getPage(params: GetPageI): Observable<ResponseI<PageRenderI>> {
    const queryParams = buildQueryParamsPage(params);
    return this._httpClient.get<ResponseI<PageRenderI>>(
      `${this.url}/${this.prefix}/public/page${queryParams}`,
    );
  }
}
