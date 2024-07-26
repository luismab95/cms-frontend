import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { SitieI } from './sitie.types';

@Injectable({ providedIn: 'root' })
export class SitieService {
    // Private
    private url = environment.apiUrl;
    private _sitie: ReplaySubject<SitieI> = new ReplaySubject<SitieI>(1);
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
    set sitie(value: SitieI) {
        // Store the value
        this._sitie.next(value);
    }

    get sitie$(): Observable<SitieI> {
        return this._sitie.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Find the sitie
     *
     */
    find(): Observable<ResponseI<SitieI>> {
        return this._httpClient
            .get<ResponseI<SitieI>>(`${this.url}/ms-cms/sitie`)
            .pipe(
                tap((response) => {
                    this._sitie.next(response.message);
                })
            );
    }

    /**
     * Delete the sitie
     *
     * @param sitieId
     */
    delete(sitieId: number): Observable<ResponseI<string>> {
        return this._httpClient.delete<ResponseI<string>>(
            `${this.url}/ms-cms/sitie/${sitieId}`
        );
    }

    /**
     * Update the sitie
     *
     * @param sitieId
     * @param sitie
     */
    update(sitieId: number, sitie: SitieI): Observable<ResponseI<SitieI>> {
        return this._httpClient
            .patch<
                ResponseI<SitieI>
            >(`${this.url}/ms-cms/sitie/${sitieId}`, { ...sitie })
            .pipe(
                tap((response) => {
                    this._sitie.next(response.message);
                })
            );
    }
}
