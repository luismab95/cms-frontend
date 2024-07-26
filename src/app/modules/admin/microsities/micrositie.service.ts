import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    PaginationResponseI,
    PaginationResquestI,
    ResponseI,
} from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { MicrositieI } from './micrositie.types';

@Injectable({ providedIn: 'root' })
export class MicrosityService {
    // Private
    private url = environment.apiUrl;
    private _microsities: ReplaySubject<PaginationResponseI<MicrositieI[]>> =
        new ReplaySubject<PaginationResponseI<MicrositieI[]>>(1);
    private _micrositie: ReplaySubject<MicrositieI> =
        new ReplaySubject<MicrositieI>(1);
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for microsities
     *
     * @param value
     */
    set microsities(value: PaginationResponseI<MicrositieI[]>) {
        // Store the value
        this._microsities.next(value);
    }

    get microsities$(): Observable<PaginationResponseI<MicrositieI[]>> {
        return this._microsities.asObservable();
    }

    /**
     * Setter & getter for micrositie
     *
     * @param value
     */
    set micrositie(value: MicrositieI) {
        // Store the value
        this._micrositie.next(value);
    }

    get micrositie$(): Observable<MicrositieI> {
        return this._micrositie.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all microsities
     * @param params
     * @returns
     */
    getAll(
        params: PaginationResquestI
    ): Observable<ResponseI<PaginationResponseI<MicrositieI[]>>> {
        let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
        if (params.search !== null) queryParams += `search=${params.search}&`;
        if (params.status !== null) queryParams += `status=${params.status}&`;

        return this._httpClient
            .get<
                ResponseI<PaginationResponseI<MicrositieI[]>>
            >(`${this.url}/ms-cms/microsities${queryParams}`)
            .pipe(
                tap((response) => {
                    this._microsities.next(response.message);
                })
            );
    }

    /**
     * Create the micrositie
     *
     * @param micrositie
     */
    create(micrositie: MicrositieI): Observable<ResponseI<MicrositieI>> {
        return this._httpClient
            .post<
                ResponseI<MicrositieI>
            >(`${this.url}/ms-cms/microsities`, { ...micrositie })
            .pipe(
                tap((response) => {
                    this._micrositie.next(response.message);
                })
            );
    }

    /**
     * Delete the micrositie
     *
     * @param micrositieId
     */
    delete(micrositieId: number): Observable<ResponseI<string>> {
        return this._httpClient.delete<ResponseI<string>>(
            `${this.url}/ms-cms/microsities/${micrositieId}`
        );
    }

    /**
     * Update the user
     *
     * @param micrositieId
     * @param micrositie
     */
    update(
        micrositieId: number,
        micrositie: MicrositieI
    ): Observable<ResponseI<MicrositieI>> {
        return this._httpClient
            .patch<
                ResponseI<MicrositieI>
            >(`${this.url}/ms-cms/microsities/${micrositieId}`, { ...micrositie })
            .pipe(
                tap((response) => {
                    this._micrositie.next(response.message);
                })
            );
    }
}
