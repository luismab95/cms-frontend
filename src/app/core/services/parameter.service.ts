import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ParameterI } from '@core/interfaces';
import { ResponseI } from '@shared/interfaces';
import { environment } from 'environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ParameterService {
  parameters = signal<ParameterI[]>([]);
  publicParameters = signal<ParameterI[]>([]);

  private readonly prefix = 'ms-security';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get public parameters
   * @returns
   */
  getPublic(): Observable<ResponseI<ParameterI[]>> {
    return this._httpClient
      .get<ResponseI<ParameterI[]>>(`${this.url}/${this.prefix}/parameters/public`)
      .pipe(
        tap((response) => {
          this.publicParameters.set(response.message);
        }),
      );
  }

  /**
   * Get all public
   * @returns
   */
  getAll(): Observable<ResponseI<ParameterI[]>> {
    return this._httpClient
      .get<ResponseI<ParameterI[]>>(`${this.url}/${this.prefix}/parameters`)
      .pipe(
        tap((response) => {
          this.parameters.set(response.message);
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
