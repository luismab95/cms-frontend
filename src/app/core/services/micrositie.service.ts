import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { PaginationResponseI, PaginationResquestI, ResponseI } from '@shared/interfaces';
import { buildQueryParams, DefaultPaginationParams } from '@shared/utils';
import { MicrositieI } from '@core/interfaces';
import { environment } from 'environments/environment';
import { Observable, of, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MicrosityService {
  microsities =
    signal<PaginationResponseI<MicrositieI[]>>(DefaultPaginationParams<MicrositieI[]>());
  micrositie = signal<MicrositieI | null>(null);

  private readonly prefix = 'ms-cms';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get all microsities
   * @param params
   * @returns
   */
  getAll(params: PaginationResquestI): Observable<ResponseI<PaginationResponseI<MicrositieI[]>>> {
    const queryParams = buildQueryParams(params);
    return this._httpClient
      .get<ResponseI<PaginationResponseI<MicrositieI[]>>>(
        `${this.url}/${this.prefix}/microsities${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this.microsities.set(response.message);
        }),
      );
  }

  /**
   * Find micrositie
   * @param micrositieId
   * @returns
   */
  find(micrositieId: number): Observable<ResponseI<MicrositieI> | null> {
    if (micrositieId === 0) {
      this.micrositie.set(null);
      return of(null);
    }
    return this._httpClient
      .get<ResponseI<MicrositieI>>(`${this.url}/${this.prefix}/microsities/${micrositieId}`)
      .pipe(
        tap((response) => {
          this.micrositie.set(response.message);
        }),
      );
  }

  /**
   * Create the micrositie
   * @param micrositie
   * @returns
   */
  create(micrositie: MicrositieI): Observable<ResponseI<MicrositieI>> {
    return this._httpClient
      .post<ResponseI<MicrositieI>>(`${this.url}/${this.prefix}/microsities`, micrositie)
      .pipe(
        tap((response) => {
          this.micrositie.set(response.message);
        }),
      );
  }

  /**
   * Delete the micrositie
   * @param micrositieId
   * @returns
   */
  delete(micrositieId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(
      `${this.url}/${this.prefix}/microsities/${micrositieId}`,
    );
  }

  /**
   * Update the micrositie
   * @param micrositieId
   * @param micrositie
   * @returns
   */
  update(micrositieId: number, micrositie: MicrositieI): Observable<ResponseI<MicrositieI>> {
    return this._httpClient
      .patch<ResponseI<MicrositieI>>(`${this.url}/${this.prefix}/microsities/${micrositieId}`, {
        ...micrositie,
      })
      .pipe(
        tap((response) => {
          this.micrositie.set(response.message);
        }),
      );
  }
}
