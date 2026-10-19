import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import {
  ElementCMSI,
  PaginationResponseI,
  PaginationResquestI,
  ResponseI,
} from '@shared/interfaces';
import { buildQueryParams, DefaultPaginationParams } from '@shared/utils';
import { environment } from 'environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ElementService {
  elements = signal<PaginationResponseI<ElementCMSI[]>>(DefaultPaginationParams<ElementCMSI[]>());

  private readonly prefix = 'ms-cms';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get all elements
   * @param params
   * @returns
   */
  getAll(params: PaginationResquestI): Observable<ResponseI<PaginationResponseI<ElementCMSI[]>>> {
    const queryParams = buildQueryParams(params);
    return this._httpClient
      .get<ResponseI<PaginationResponseI<ElementCMSI[]>>>(
        `${this.url}/${this.prefix}/elements${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this.elements.set(response.message);
        }),
      );
  }
}
