import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
    PaginationResponseI,
    PaginationResquestI,
    ResponseI,
} from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { ElementCMSI } from '../interfaces/element.interface';

@Injectable({ providedIn: 'root' })
export class ElementService {
    private url = environment.apiUrl;
    private _elements: ReplaySubject<PaginationResponseI<ElementCMSI[]>> =
        new ReplaySubject<PaginationResponseI<ElementCMSI[]>>(1);
    private _httpClient = inject(HttpClient);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for elements
     *
     * @param value
     */
    set elements(value: PaginationResponseI<ElementCMSI[]>) {
        // Store the value
        this._elements.next(value);
    }

    get elements$(): Observable<PaginationResponseI<ElementCMSI[]>> {
        return this._elements.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all elements
     * @param params
     * @returns
     */
    getAll(
        params: PaginationResquestI
    ): Observable<ResponseI<PaginationResponseI<ElementCMSI[]>>> {
        let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
        if (params.search !== null) queryParams += `search=${params.search}&`;
        if (params.status !== null) queryParams += `status=${params.status}&`;

        return this._httpClient
            .get<
                ResponseI<PaginationResponseI<ElementCMSI[]>>
            >(`${this.url}/ms-cms/elements${queryParams}`)
            .pipe(
                tap((response) => {
                    this._elements.next(response.message);
                })
            );
    }
}
