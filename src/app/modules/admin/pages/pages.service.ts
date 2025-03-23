import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    PaginationResponseI,
    ResponseI,
} from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import {
    GetPageI,
    PageI,
    PagePaginationResquestI,
    PageRenderI,
} from './pages.types';

@Injectable({ providedIn: 'root' })
export class PageService {
    // Private
    private url = environment.apiUrl;
    private _pages: ReplaySubject<PaginationResponseI<PageI[]>> =
        new ReplaySubject<PaginationResponseI<PageI[]>>(1);
    private _page: ReplaySubject<PageI> = new ReplaySubject<PageI>(1);
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

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
    set page(value: PageI) {
        // Store the value
        this._page.next(value);
    }

    get page$(): Observable<PageI> {
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
    getAll(
        params: PagePaginationResquestI
    ): Observable<ResponseI<PaginationResponseI<PageI[]>>> {
        let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
        if (params.search !== null) queryParams += `search=${params.search}&`;
        if (params.status !== null) queryParams += `status=${params.status}&`;
        if (params.micrositieId !== null)
            queryParams += `micrositieId=${params.micrositieId}&`;

        return this._httpClient
            .get<
                ResponseI<PaginationResponseI<PageI[]>>
            >(`${this.url}/ms-cms/pages${queryParams}`)
            .pipe(
                tap((response) => {
                    this._pages.next(response.message);
                })
            );
    }

    /**
     * Find page
     * @param pageId
     * @returns
     */
    find(pageId: number): Observable<ResponseI<PageI>> {
        if (!pageId) return;
        return this._httpClient
            .get<ResponseI<PageI>>(`${this.url}/ms-cms/pages/${pageId}`)
            .pipe(
                tap((response) => {
                    this._page.next(response.message);
                })
            );
    }

    /**
     * Create the page
     *
     * @param page
     */
    create(page: PageI): Observable<ResponseI<PageI>> {
        return this._httpClient
            .post<ResponseI<PageI>>(`${this.url}/ms-cms/pages`, { ...page })
            .pipe(
                tap((response) => {
                    this._page.next(response.message);
                })
            );
    }

    /**
     * Delete the page
     *
     * @param pageId
     */
    delete(pageId: number): Observable<ResponseI<string>> {
        return this._httpClient.delete<ResponseI<string>>(
            `${this.url}/ms-cms/pages/${pageId}`
        );
    }

    /**
     * Save the page
     *
     * @param page
     */
    saveDraft(pageId: number, page: PageI): Observable<ResponseI<string>> {
        return this._httpClient.patch<ResponseI<string>>(
            `${this.url}/ms-cms/pages/draft/${pageId}`,
            { ...page }
        );
    }

    /**
     * Delete draft page
     *
     * @param pageId
     */
    deleteDraft(pageId: number): Observable<ResponseI<PageI>> {
        return this._httpClient
            .delete<
                ResponseI<PageI>
            >(`${this.url}/ms-cms/pages/draft/${pageId}`)
            .pipe(
                tap((response) => {
                    this._page.next(response.message);
                })
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
            .patch<
                ResponseI<PageI>
            >(`${this.url}/ms-cms/pages/${pageId}`, { ...page })
            .pipe(
                tap((response) => {
                    this._page.next(response.message);
                })
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
        if (params.micrositie !== null)
            queryParams += `micrositie=${params.micrositie}&`;

        return this._httpClient.get<ResponseI<PageRenderI>>(
            `${this.url}/ms-cms/public/page${queryParams}`
        );
    }
}
