import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { PaginationResponseI, PaginationResquestI, ResponseI } from '@shared/interfaces';
import { buildQueryParams, DefaultPaginationParams } from '@shared/utils';
import { TemplateI } from '@core/interfaces';
import { environment } from 'environments/environment';
import { Observable, tap, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  templates = signal<PaginationResponseI<TemplateI[]>>(DefaultPaginationParams<TemplateI[]>());
  template = signal<TemplateI | null>(null);

  private readonly prefix = 'ms-cms';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get all templates
   * @param params
   * @returns
   */
  getAll(params: PaginationResquestI): Observable<ResponseI<PaginationResponseI<TemplateI[]>>> {
    const queryParams = buildQueryParams(params);
    return this._httpClient
      .get<ResponseI<PaginationResponseI<TemplateI[]>>>(
        `${this.url}/${this.prefix}/templates${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this.templates.set(response.message);
          this.template.set(null);
        }),
      );
  }

  /**
   * Find template
   * @param templateId
   * @returns
   */
  find(templateId: number): Observable<ResponseI<TemplateI> | null> {
    if (templateId === 0) {
      this.template.set(null);
      return of(null);
    }
    return this._httpClient
      .get<ResponseI<TemplateI>>(`${this.url}/${this.prefix}/templates/${templateId}`)
      .pipe(
        tap((response) => {
          this.template.set(response.message);
        }),
      );
  }

  /**
   * Create the template
   * @param template
   * @returns
   */
  create(template: TemplateI): Observable<ResponseI<TemplateI>> {
    return this._httpClient
      .post<ResponseI<TemplateI>>(`${this.url}/${this.prefix}/templates`, { ...template })
      .pipe(
        tap((response) => {
          this.template.set(response.message);
        }),
      );
  }

  /**
   * Delete the template
   * @param templateId
   * @returns
   */
  delete(templateId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(
      `${this.url}/${this.prefix}/templates/${templateId}`,
    );
  }

  /**
   * Save the template
   *
   * @param templateId
   * @param template
   * @returns
   */
  saveDraft(templateId: number, template: TemplateI): Observable<ResponseI<string>> {
    return this._httpClient.patch<ResponseI<string>>(
      `${this.url}/${this.prefix}/templates/draft/${templateId}`,
      { ...template },
    );
  }

  /**
   * Delete draft template
   * @param templateId
   * @returns
   */
  deleteDraft(templateId: number): Observable<ResponseI<TemplateI>> {
    return this._httpClient
      .delete<ResponseI<TemplateI>>(`${this.url}/${this.prefix}/templates/draft/${templateId}`)
      .pipe(
        tap((response) => {
          this.template.set(response.message);
        }),
      );
  }

  /**
   * Update the template
   * @param templateId
   * @param template
   * @returns
   */
  update(templateId: number, template: TemplateI): Observable<ResponseI<TemplateI>> {
    return this._httpClient
      .patch<ResponseI<TemplateI>>(`${this.url}/${this.prefix}/templates/${templateId}`, {
        ...template,
      })
      .pipe(
        tap((response) => {
          this.template.set(response.message);
        }),
      );
  }
}
