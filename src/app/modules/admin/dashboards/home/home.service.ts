import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomeService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    private _dataA: BehaviorSubject<any> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for data
     */
    get data$(): Observable<any> {
        return this._data.asObservable();
    }

    /**
     * Getter for data
     */
    get dataA$(): Observable<any> {
        return this._dataA.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get data
     */
    getData(): Observable<any> {
        return this._httpClient.get('api/dashboards/project').pipe(
            tap((response: any) => {
                this._data.next(response);
            })
        );
    }

    /**
     * Get data
     */
    getDataA(): Observable<any> {
        return this._httpClient.get('api/dashboards/analytics').pipe(
            tap((response: any) => {
                this._dataA.next(response);
            })
        );
    }
}
