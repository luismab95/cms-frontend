import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { InitializerI, InitialUserI } from '@core/interfaces';
import { ResponseI } from '@shared/interfaces';
import { environment } from 'environments/environment';
import { catchError, Observable, of, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InitializerService {
  initializer = signal<InitializerI | undefined>(undefined);

  private readonly prefix = 'ms-auth';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Find the sitie
   * @returns
   */
  find(): Observable<ResponseI<InitializerI | undefined>> {
    return this._httpClient
      .get<ResponseI<InitializerI | undefined>>(`${this.url}/${this.prefix}/auth/initializer`)
      .pipe(
        tap((response) => {
          this.initializer.set(response.message);
        }),
      );
  }

  /**
   * Save initial users
   * @param users
   * @returns
   */
  saveUsers(users: InitialUserI[]): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(`${this.url}/${this.prefix}/auth/initializer`, {
      users,
    });
  }
}
