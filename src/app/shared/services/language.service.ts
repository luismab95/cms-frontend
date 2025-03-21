import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    PaginationResponseI,
    PaginationResquestI,
    ResponseI,
} from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { LanguageI } from '../interfaces/language.types';

@Injectable({ providedIn: 'root' })
export class LanguageService {
    // Private
    private url = environment.apiUrl;
    private _languages: ReplaySubject<PaginationResponseI<LanguageI[]>> =
        new ReplaySubject<PaginationResponseI<LanguageI[]>>(1);
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for sitie
     *
     * @param value
     */
    set languages(value: PaginationResponseI<LanguageI[]>) {
        // Store the value
        this._languages.next(value);
    }

    get languages$(): Observable<PaginationResponseI<LanguageI[]>> {
        return this._languages.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all languages
     * @param params
     * @returns
     */
    getAll(
        params: PaginationResquestI
    ): Observable<ResponseI<PaginationResponseI<LanguageI[]>>> {
        let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
        if (params.search !== null) queryParams += `search=${params.search}&`;
        if (params.status !== null) queryParams += `status=${params.status}&`;

        return this._httpClient
            .get<
                ResponseI<PaginationResponseI<LanguageI[]>>
            >(`${this.url}/ms-cms/languages${queryParams}`)
            .pipe(
                tap((response) => {
                    this._languages.next(response.message);
                })
            );
    }

    /**
     * Create the language
     *
     * @param language
     */
    create(language: LanguageI): Observable<ResponseI<string>> {
        return this._httpClient.post<ResponseI<string>>(
            `${this.url}/ms-cms/languages`,
            { ...language }
        );
    }

    /**
     * Delete the language
     *
     * @param languageId
     */
    delete(languageId: number): Observable<ResponseI<string>> {
        return this._httpClient.delete<ResponseI<string>>(
            `${this.url}/ms-cms/languages/${languageId}`
        );
    }

    /**
     * Update the language
     *
     * @param languageId
     * @param language
     */
    update(
        languageId: number,
        language: LanguageI
    ): Observable<ResponseI<LanguageI>> {
        return this._httpClient.patch<ResponseI<LanguageI>>(
            `${this.url}/ms-cms/languages/${languageId}`,
            { ...language }
        );
    }
}
