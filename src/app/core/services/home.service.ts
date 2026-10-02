import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { CountElementsI, Top10PagesI, VisitI, WeekVisitI, YearVisitI } from '@core/interfaces';
import { ResponseI } from '@shared/interfaces';
import { environment } from 'environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomeService {
  countElements = signal<CountElementsI | null>(null);
  weekVisit = signal<WeekVisitI | null>(null);
  yearVisit = signal<YearVisitI | null>(null);
  visitVsPages = signal<VisitI | null>(null);
  top10Pages = signal<Top10PagesI[]>([]);

  private readonly prefix = 'ms-cms';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get count elements
   * @returns
   */
  getCountElements(): Observable<ResponseI<CountElementsI>> {
    return this._httpClient
      .get<ResponseI<CountElementsI>>(`${this.url}/${this.prefix}/dashboard/count-elements`)
      .pipe(
        tap((response) => {
          this.countElements.set(response.message);
        }),
      );
  }

  /**
   * Get week visit
   * @returns
   */
  getWeekVisit(): Observable<ResponseI<WeekVisitI>> {
    return this._httpClient
      .get<ResponseI<WeekVisitI>>(`${this.url}/${this.prefix}/dashboard/week-visits`)
      .pipe(
        tap((response) => {
          this.weekVisit.set(response.message);
        }),
      );
  }

  /**
   * Get year visit
   * @returns
   */
  getYearVisit(): Observable<ResponseI<YearVisitI>> {
    return this._httpClient
      .get<ResponseI<YearVisitI>>(`${this.url}/${this.prefix}/dashboard/year-visits`)
      .pipe(
        tap((response) => {
          this.yearVisit.set(response.message);
        }),
      );
  }

  /**
   * Get visitors vs page views
   * @returns
   */
  getVisitVsPages(): Observable<ResponseI<VisitI>> {
    return this._httpClient
      .get<ResponseI<VisitI>>(`${this.url}/${this.prefix}/dashboard/visits`)
      .pipe(
        tap((response) => {
          this.visitVsPages.set(response.message);
        }),
      );
  }

  /**
   * Get top 10 pages
   * @returns
   */
  getTop10Pages(): Observable<ResponseI<Top10PagesI[]>> {
    return this._httpClient
      .get<ResponseI<Top10PagesI[]>>(`${this.url}/${this.prefix}/dashboard/top-10-pages`)
      .pipe(
        tap((response) => {
          this.top10Pages.set(response.message);
        }),
      );
  }
}
