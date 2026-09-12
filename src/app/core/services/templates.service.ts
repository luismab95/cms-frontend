import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  PaginationResponseI,
  PaginationResquestI,
  ResponseI,
} from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { TemplateI } from '../interfaces/template.interface';
import { Observable, ReplaySubject, tap, EMPTY } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TemplateService {
  // Private
  private prefix = 'ms-cms';
  private url = environment.apiUrl;
  private _templates: ReplaySubject<PaginationResponseI<TemplateI[]>> = new ReplaySubject<
    PaginationResponseI<TemplateI[]>
  >(1);
  private _template: ReplaySubject<TemplateI | null> = new ReplaySubject<TemplateI | null>(1);
  /**
   * Constructor
   */
  constructor(private _httpClient: HttpClient) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Setter & getter for templates
   *
   * @param value
   */
  set templates(value: PaginationResponseI<TemplateI[]>) {
    // Store the value
    this._templates.next(value);
  }

  get templates$(): Observable<PaginationResponseI<TemplateI[]>> {
    return this._templates.asObservable();
  }

  /**
   * Setter & getter for template
   *
   * @param value
   */
  set template(value: TemplateI) {
    // Store the value
    this._template.next(value);
  }

  get template$(): Observable<TemplateI | null> {
    return this._template.asObservable();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get all templates
   * @param params
   * @returns
   */
  getAll(params: PaginationResquestI): Observable<ResponseI<PaginationResponseI<TemplateI[]>>> {
    let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
    if (params.search !== null) queryParams += `search=${params.search}&`;
    if (params.status !== null) queryParams += `status=${params.status}&`;

    return this._httpClient
      .get<ResponseI<PaginationResponseI<TemplateI[]>>>(
        `${this.url}/${this.prefix}/templates${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this._templates.next(response.message);
          this._template.next(null);
        }),
      );
  }

  /**
   * Find template
   * @param templateId
   * @returns
   */
  find(templateId: number): Observable<ResponseI<TemplateI>> {
    if (!templateId) return EMPTY;
    return this._httpClient
      .get<ResponseI<TemplateI>>(`${this.url}/${this.prefix}/templates/${templateId}`)
      .pipe(
        tap((response) => {
          this._template.next(response.message);
        }),
      );
  }

  /**
   * Create the template
   *
   * @param template
   */
  create(template: TemplateI): Observable<ResponseI<TemplateI>> {
    return this._httpClient
      .post<ResponseI<TemplateI>>(`${this.url}/${this.prefix}/templates`, { ...template })
      .pipe(
        tap((response) => {
          this._template.next(response.message);
        }),
      );
  }

  /**
   * Delete the template
   *
   * @param templateId
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
   */
  saveDraft(templateId: number, template: TemplateI): Observable<ResponseI<string>> {
    return this._httpClient.patch<ResponseI<string>>(
      `${this.url}/${this.prefix}/templates/draft/${templateId}`,
      { ...template },
    );
  }

  /**
   * Delete draft template
   *
   * @param templateId
   */
  deleteDraft(templateId: number): Observable<ResponseI<TemplateI>> {
    return this._httpClient
      .delete<ResponseI<TemplateI>>(`${this.url}/${this.prefix}/templates/draft/${templateId}`)
      .pipe(
        tap((response) => {
          this._template.next(response.message);
        }),
      );
  }

  /**
   * Update the template
   *
   * @param templateId
   * @param template
   */
  update(templateId: number, template: TemplateI): Observable<ResponseI<TemplateI>> {
    return this._httpClient
      .patch<ResponseI<TemplateI>>(`${this.url}/${this.prefix}/templates/${templateId}`, {
        ...template,
      })
      .pipe(
        tap((response) => {
          this._template.next(response.message);
        }),
      );
  }
}
