import { HttpClient } from '@angular/common/http';
import { inject, Injectable, Signal, signal } from '@angular/core';
import { PaginationResponseI, ResponseI } from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import {
  PageI,
  PagePaginationResquestI,
  GetPageI,
  PageRenderI,
} from '../interfaces/page.interface';
import { Observable, of, ReplaySubject, tap } from 'rxjs';
import { SectionI, SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';

@Injectable({ providedIn: 'root' })
export class PageService {
  // Private
  private prefix = 'ms-cms';
  private url = environment.apiUrl;
  private _pages: ReplaySubject<PaginationResponseI<PageI[]>> = new ReplaySubject<
    PaginationResponseI<PageI[]>
  >(1);
  private _page: ReplaySubject<PageI | null> = new ReplaySubject<PageI | null>(1);
  private _selectedItemsInGrid: ReplaySubject<SelectedItemsInGridI | null> =
    new ReplaySubject<SelectedItemsInGridI | null>(1);

  private _sections = signal<SectionI[]>([]);
  private _sectionsHeader = signal<SectionI[]>([]);
  private _sectionsFooter = signal<SectionI[]>([]);

  private _httpClient = inject(HttpClient);

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Setter & getter for _selectedItemsInGridI
   *
   * @param value
   */
  set selectedItemsInGrid(value: SelectedItemsInGridI) {
    // Store the value
    this._selectedItemsInGrid.next(value);
  }

  get selectedItemsInGrid$(): Observable<SelectedItemsInGridI | null> {
    return this._selectedItemsInGrid.asObservable();
  }

  /**
   * Setter & getter for sections
   *
   * @param value
   */
  set sections(value: SectionI[]) {
    this._sections.set(value);
  }

  get sections(): Signal<SectionI[]> {
    return this._sections.asReadonly();
  }

  set sectionsHeader(value: SectionI[]) {
    this._sectionsHeader.set(value);
  }

  get sectionsHeader(): Signal<SectionI[]> {
    return this._sectionsHeader.asReadonly();
  }

  set sectionsFooter(value: SectionI[]) {
    this._sectionsFooter.set(value);
  }

  get sectionsFooter(): Signal<SectionI[]> {
    return this._sectionsFooter.asReadonly();
  }

  /**
   * Setter & getter for pages
   *
   * @param value
   */
  set pages(value: PaginationResponseI<PageI[]>) {
    // Store the value
    this._pages.next(value);
  }

  get pages$(): Observable<PaginationResponseI<PageI[]>> {
    return this._pages.asObservable();
  }

  /**
   * Setter & getter for page
   *
   * @param value
   */
  set page(value: PageI | null) {
    // Store the value
    this._page.next(value);
  }

  get page$(): Observable<PageI | null> {
    return this._page.asObservable();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get all pages
   * @param params
   * @returns
   */
  getAll(params: PagePaginationResquestI): Observable<ResponseI<PaginationResponseI<PageI[]>>> {
    let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
    if (params.search !== null) queryParams += `search=${params.search}&`;
    if (params.status !== null) queryParams += `status=${params.status}&`;
    if (params.micrositieId !== null) queryParams += `micrositieId=${params.micrositieId}&`;

    return this._httpClient
      .get<ResponseI<PaginationResponseI<PageI[]>>>(
        `${this.url}/${this.prefix}/pages${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this._pages.next(response.message);
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
      this._page.next(null!);
      return of(null);
    }
    return this._httpClient
      .get<ResponseI<PageI>>(`${this.url}/${this.prefix}/pages/${pageId}`)
      .pipe(
        tap((response) => {
          this._page.next(response.message);
        }),
      );
  }

  /**
   * Create the page
   *
   * @param page
   */
  create(page: PageI): Observable<ResponseI<PageI>> {
    return this._httpClient
      .post<ResponseI<PageI>>(`${this.url}/${this.prefix}/pages`, { ...page })
      .pipe(
        tap((response) => {
          this._page.next(response.message);
        }),
      );
  }

  /**
   * Delete the page
   *
   * @param pageId
   */
  delete(pageId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(`${this.url}/${this.prefix}/pages/${pageId}`);
  }

  /**
   * Save the page
   *
   * @param page
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
   *
   * @param pageId
   */
  deleteDraft(pageId: number): Observable<ResponseI<PageI>> {
    return this._httpClient
      .delete<ResponseI<PageI>>(`${this.url}/${this.prefix}/pages/draft/${pageId}`)
      .pipe(
        tap((response) => {
          this._page.next(response.message);
        }),
      );
  }

  /**
   * Update the page
   *
   * @param pageId
   * @param page
   */
  update(pageId: number, page: PageI): Observable<ResponseI<PageI>> {
    return this._httpClient
      .patch<ResponseI<PageI>>(`${this.url}/${this.prefix}/pages/${pageId}`, { ...page })
      .pipe(
        tap((response) => {
          this._page.next(response.message);
        }),
      );
  }

  /**
   * Get  page for render
   * @param params
   * @returns
   */
  getPage(params: GetPageI): Observable<ResponseI<PageRenderI>> {
    let queryParams: string = `?lang=${params.lang}&`;
    if (params.page !== null) queryParams += `page=${params.page}&`;
    if (params.micrositie !== null) queryParams += `micrositie=${params.micrositie}&`;
    queryParams += `preview=${params.preview ? 'true' : 'false'}&`;

    return this._httpClient.get<ResponseI<PageRenderI>>(
      `${this.url}/${this.prefix}/public/page${queryParams}`,
    );
  }
}
