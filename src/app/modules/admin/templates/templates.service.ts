import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    PaginationResponseI,
    PaginationResquestI,
    ResponseI,
} from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { TemplateI } from './templates.types';

@Injectable({ providedIn: 'root' })
export class TemplateService {
    // Private
    private url = environment.apiUrl;
    private _templates: ReplaySubject<PaginationResponseI<TemplateI[]>> =
        new ReplaySubject<PaginationResponseI<TemplateI[]>>(1);
    private _template: ReplaySubject<TemplateI> = new ReplaySubject<TemplateI>(
        1
    );
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

    get template$(): Observable<TemplateI> {
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
    getAll(
        params: PaginationResquestI
    ): Observable<ResponseI<PaginationResponseI<TemplateI[]>>> {
        let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
        if (params.search !== null) queryParams += `search=${params.search}&`;
        if (params.status !== null) queryParams += `status=${params.status}&`;

        return this._httpClient
            .get<
                ResponseI<PaginationResponseI<TemplateI[]>>
            >(`${this.url}/ms-cms/templates${queryParams}`)
            .pipe(
                tap((response) => {
                    this._templates.next(response.message);
                })
            );
    }

    /**
     * Create the template
     *
     * @param template
     */
    create(template: TemplateI): Observable<ResponseI<TemplateI>> {
        return this._httpClient
            .post<
                ResponseI<TemplateI>
            >(`${this.url}/ms-cms/templates`, { ...template })
            .pipe(
                tap((response) => {
                    this._template.next(response.message);
                })
            );
    }

    /**
     * Delete the template
     *
     * @param templateId
     */
    delete(templateId: number): Observable<ResponseI<string>> {
        return this._httpClient.delete<ResponseI<string>>(
            `${this.url}/ms-cms/templates/${templateId}`
        );
    }

    /**
     * Update the user
     *
     * @param templateId
     * @param template
     */
    update(
        templateId: number,
        template: TemplateI
    ): Observable<ResponseI<TemplateI>> {
        return this._httpClient
            .patch<
                ResponseI<TemplateI>
            >(`${this.url}/ms-cms/templates/${templateId}`, { ...template })
            .pipe(
                tap((response) => {
                    this._template.next(response.message);
                })
            );
    }
}
