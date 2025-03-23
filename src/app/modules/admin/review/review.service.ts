import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    PaginationResponseI,
    PaginationResquestI,
    ResponseI,
} from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { PageReviewDataI, ReviewPageI } from './review.types';

@Injectable({ providedIn: 'root' })
export class ReviewPageService {
    // Private
    private url = environment.apiUrl;
    private _reviewPages: ReplaySubject<
        PaginationResponseI<PageReviewDataI[]>
    > = new ReplaySubject<PaginationResponseI<PageReviewDataI[]>>(1);
    private _reviewPage: ReplaySubject<PageReviewDataI> =
        new ReplaySubject<PageReviewDataI>(1);
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
    set pages(value: PaginationResponseI<PageReviewDataI[]>) {
        // Store the value
        this._reviewPages.next(value);
    }

    get pages$(): Observable<PaginationResponseI<PageReviewDataI[]>> {
        return this._reviewPages.asObservable();
    }

    /**
     * Setter & getter for page
     *
     * @param value
     */
    set page(value: PageReviewDataI) {
        // Store the value
        this._reviewPage.next(value);
    }

    get page$(): Observable<PageReviewDataI> {
        return this._reviewPage.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all pages review
     * @param params
     * @returns
     */
    getAll(
        params: PaginationResquestI
    ): Observable<ResponseI<PaginationResponseI<PageReviewDataI[]>>> {
        let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
        if (params.search !== null) queryParams += `search=${params.search}&`;
        if (params.status !== null) queryParams += `status=${params.status}&`;

        return this._httpClient
            .get<
                ResponseI<PaginationResponseI<PageReviewDataI[]>>
            >(`${this.url}/ms-cms/pages/review${queryParams}`)
            .pipe(
                tap((response) => {
                    this._reviewPages.next(response.message);
                    this._reviewPage.next(null);
                })
            );
    }

    /**
     * Find page review
     * @param pageId
     * @returns
     */
    find(pageId: number): Observable<ResponseI<PageReviewDataI>> {
        if (!pageId) return;
        return this._httpClient
            .get<
                ResponseI<PageReviewDataI>
            >(`${this.url}/ms-cms/pages/review/${pageId}`)
            .pipe(
                tap((response) => {
                    this._reviewPage.next(response.message);
                })
            );
    }

    /**
     * Review the page
     * @param reviewPageId
     * @param reviewPage
     */
    reviewPage(
        reviewPageId: number,
        reviewPage: ReviewPageI
    ): Observable<ResponseI<string>> {
        return this._httpClient.patch<ResponseI<string>>(
            `${this.url}/ms-cms/pages/review/${reviewPageId}`,
            { ...reviewPage }
        );
    }
}
