import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import {
    CountElementsI,
    Top10PagesI,
    WeekVisitI,
    YearVisitI,
} from './home.types';

@Injectable({ providedIn: 'root' })
export class HomeService {
    private url = environment.apiUrl;
    private _countElements: ReplaySubject<CountElementsI> =
        new ReplaySubject<CountElementsI>(1);
    private _weekVisit: ReplaySubject<WeekVisitI> =
        new ReplaySubject<WeekVisitI>(1);
    private _yearVisit: ReplaySubject<YearVisitI> =
        new ReplaySubject<YearVisitI>(1);
    private _visitVsPages: ReplaySubject<YearVisitI> =
        new ReplaySubject<YearVisitI>(1);
    private _top10Pages: ReplaySubject<Top10PagesI[]> = new ReplaySubject<
        Top10PagesI[]
    >(1);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for weekVisit
     *
     * @param value
     */
    set weekVisit(value: WeekVisitI) {
        // Store the value
        this._weekVisit.next(value);
    }

    get weekVisit$(): Observable<WeekVisitI> {
        return this._weekVisit.asObservable();
    }

    /**
     * Setter & getter for YearVisitI
     *
     * @param value
     */
    set yearVisit(value: YearVisitI) {
        // Store the value
        this._yearVisit.next(value);
    }

    get yearVisit$(): Observable<YearVisitI> {
        return this._yearVisit.asObservable();
    }

    /**
     * Setter & getter for visitVsPages
     *
     * @param value
     */
    set visitVsPages(value: YearVisitI) {
        // Store the value
        this._visitVsPages.next(value);
    }

    get visitVsPages$(): Observable<YearVisitI> {
        return this._visitVsPages.asObservable();
    }

    /**
     * Setter & getter for top10Pages
     *
     * @param value
     */
    set top10Pages(value: Top10PagesI[]) {
        // Store the value
        this._top10Pages.next(value);
    }

    get top10Pages$(): Observable<Top10PagesI[]> {
        return this._top10Pages.asObservable();
    }

    /**
     * Setter & getter for count elements
     *
     * @param value
     */
    set countElements(value: CountElementsI) {
        // Store the value
        this._countElements.next(value);
    }

    get countElements$(): Observable<CountElementsI> {
        return this._countElements.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get count elements
     */
    getCountElements(): Observable<ResponseI<CountElementsI>> {
        return this._httpClient
            .get<
                ResponseI<CountElementsI>
            >(`${this.url}/ms-cms/dashboard/count-elements`)
            .pipe(
                tap((response) => {
                    this._countElements.next(response.message);
                })
            );
    }

    /**
     * Get week visit
     */
    getWeekVisit(): Observable<ResponseI<WeekVisitI>> {
        return this._httpClient
            .get<
                ResponseI<WeekVisitI>
            >(`${this.url}/ms-cms/dashboard/week-visits`)
            .pipe(
                tap((response) => {
                    this._weekVisit.next(response.message);
                })
            );
    }

    /**
     * Get year visit
     */
    getYearVisit(): Observable<ResponseI<YearVisitI>> {
        return this._httpClient
            .get<
                ResponseI<YearVisitI>
            >(`${this.url}/ms-cms/dashboard/year-visits`)
            .pipe(
                tap((response) => {
                    this._yearVisit.next(response.message);
                })
            );
    }

    /**
     * Get visitors vs page views
     */
    getVisitVsPages(): Observable<ResponseI<YearVisitI>> {
        return this._httpClient
            .get<
                ResponseI<YearVisitI>
            >(`${this.url}/ms-cms/dashboard/visits-vs-pages`)
            .pipe(
                tap((response) => {
                    this._visitVsPages.next(response.message);
                })
            );
    }

    /**
     * Get top 10 pages
     */
    getTop10Pages(): Observable<ResponseI<Top10PagesI[]>> {
        return this._httpClient
            .get<
                ResponseI<Top10PagesI[]>
            >(`${this.url}/ms-cms/dashboard/top-10-pages`)
            .pipe(
                tap((response) => {
                    this._top10Pages.next(response.message);
                })
            );
    }
}
