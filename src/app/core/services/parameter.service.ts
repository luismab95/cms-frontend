import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { ParameterI } from '../interfaces/parameter.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ParameterService {
  private prefix = 'ms-security';
  private url = environment.apiUrl;
  private _parameter: ReplaySubject<ParameterI[]> = new ReplaySubject<ParameterI[]>(1);
  private _parameters: ReplaySubject<ParameterI[]> = new ReplaySubject<ParameterI[]>(1);
  private _httpClient = inject(HttpClient);
  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Setter & getter for parameter
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

  /**
   * Setter & getter for parameters
   *
   * @param value
   */
  set parameters(value: ParameterI[]) {
    // Store the value
    this._parameters.next(value);
  }

  get parameters$(): Observable<ParameterI[]> {
    return this._parameters.asObservable();
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
      .get<ResponseI<ParameterI[]>>(`${this.url}/${this.prefix}/parameters/public`)
      .pipe(
        tap((response) => {
          this._parameter.next(response.message);
        }),
      );
  }

  /**
   * Get all public
   *
   */
  getAll(): Observable<ResponseI<ParameterI[]>> {
    return this._httpClient
      .get<ResponseI<ParameterI[]>>(`${this.url}/${this.prefix}/parameters`)
      .pipe(
        tap((response) => {
          this._parameters.next(response.message);
        }),
      );
  }

  /**
   * Update multiple parameters
   * @returns
   */
  updateMultiple(parameters: ParameterI[]): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(
      `${this.url}/${this.prefix}/parameters/multiple`,
      {
        items: parameters,
      },
    );
  }

  /**
   * Test email
   * @param email
   * @returns
   */
  testEmail(email: string): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(
      `${this.url}/${this.prefix}/parameters/test/email`,
      { email },
    );
  }
}
