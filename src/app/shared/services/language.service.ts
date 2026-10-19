import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { PaginationResponseI, LanguageI, PaginationResquestI, ResponseI } from '@shared/interfaces';
import { buildQueryParams, DefaultPaginationParams } from '@shared/utils';
import { environment } from 'environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  languages = signal<PaginationResponseI<LanguageI[]>>(DefaultPaginationParams<LanguageI[]>());

  private readonly prefix = 'ms-cms';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get all languages
   * @param params
   * @returns
   */
  getAll(params: PaginationResquestI): Observable<ResponseI<PaginationResponseI<LanguageI[]>>> {
    const queryParams = buildQueryParams(params);
    return this._httpClient
      .get<ResponseI<PaginationResponseI<LanguageI[]>>>(
        `${this.url}/${this.prefix}/languages${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this.languages.set(response.message);
        }),
      );
  }

  /**
   * Get all public languages
   * @returns
   */
  getAllPublic(): Observable<LanguageI[]> {
    return this._httpClient.get<LanguageI[]>(`${this.url}/${this.prefix}/public/languages`).pipe(
      tap((response) => {
        this.languages.set({
          records: response,
          total: response.length,
          page: 1,
          totalPage: 1,
        });
      }),
    );
  }

  /**
   * Create the language
   * @param language
   * @returns
   */
  create(language: LanguageI): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(
      `${this.url}/${this.prefix}/languages`,
      language,
    );
  }

  /**
   * Delete the language
   * @param languageId
   * @returns
   */
  delete(languageId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(
      `${this.url}/${this.prefix}/languages/${languageId}`,
    );
  }

  /**
   * Update the language
   * @param languageId
   * @param language
   * @returns
   */
  update(languageId: number, language: LanguageI): Observable<ResponseI<LanguageI>> {
    return this._httpClient.patch<ResponseI<LanguageI>>(
      `${this.url}/${this.prefix}/languages/${languageId}`,
      language,
    );
  }
}
