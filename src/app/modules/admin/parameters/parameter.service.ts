import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { ParameterI } from './parameter.interface';

@Injectable({ providedIn: 'root' })
export class ParameterService {
    private url = environment.apiUrl;
    private _httpClient = inject(HttpClient);
    private _parameter: ReplaySubject<ParameterI[]> = new ReplaySubject<
        ParameterI[]
    >(1);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set parameter(value: ParameterI[]) {
        // Store the value
        this._parameter.next(value);
    }

    get parameter$(): Observable<ParameterI[]> {
        return this._parameter.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get public parameters
     *
     */
    getPublic(): Observable<ResponseI<ParameterI[]>> {
        return this._httpClient
            .get<
                ResponseI<ParameterI[]>
            >(`${this.url}/ms-security/parameters/public`)
            .pipe(
                tap((response) => {
                    this._parameter.next(response.message);
                })
            );
    }

    /**
     * Get all public
     *
     */
    getAll(): Observable<ResponseI<ParameterI[]>> {
        return this._httpClient.get<ResponseI<ParameterI[]>>(
            `${this.url}/ms-security/parameters`
        );
    }

    /**
     * Update multiple parameters
     * @returns
     */
    updateMultiple(parameters: ParameterI[]): Observable<ResponseI<string>> {
        return this._httpClient.post<ResponseI<string>>(
            `${this.url}/ms-security/parameters/multiple`,
            { items: parameters }
        );
    }

    /**
     * Test email
     * @param email
     * @returns
     */
    testEmail(email: string): Observable<ResponseI<string>> {
        return this._httpClient.post<ResponseI<string>>(
            `${this.url}/ms-security/parameters/test/email`,
            { email }
        );
    }
}
