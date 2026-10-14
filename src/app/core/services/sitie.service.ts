import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { SitieI } from '@core/interfaces';
import { ResponseI } from '@shared/interfaces';
import { environment } from 'environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SitieService {
  sitie = signal<SitieI | null>(null);

  private readonly prefix = 'ms-cms';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Find the sitie
   * @returns
   */
  find(): Observable<ResponseI<SitieI>> {
    return this._httpClient.get<ResponseI<SitieI>>(`${this.url}/${this.prefix}/sitie`).pipe(
      tap((response) => {
        this.sitie.set(response.message);
      }),
    );
  }

  /**
   * Delete the sitie
   * @param sitieId
   * @returns
   */
  delete(sitieId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(
      `${this.url}/${this.prefix}/sitie/${sitieId}`,
    );
  }

  /**
   * Update the sitie
   * @param sitieId
   * @param sitie
   * @returns
   */
  update(sitieId: number, sitie: SitieI): Observable<ResponseI<SitieI>> {
    return this._httpClient
      .patch<ResponseI<SitieI>>(`${this.url}/${this.prefix}/sitie/${sitieId}`, sitie)
      .pipe(
        tap((response) => {
          this.sitie.set(response.message);
        }),
      );
  }

  /**
   * Assing users to the sitie
   * @param sitieId
   * @param users
   * @returns
   */
  assignUser(sitieId: number, users: number[]): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(
      `${this.url}/${this.prefix}/sitie/assign-users/${sitieId}`,
      {
        users,
      },
    );
  }

  /**
   * Remove user assign to the sitie
   * @param permissionId
   * @returns
   */
  removeAssigUser(permissionId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(
      `${this.url}/${this.prefix}/sitie/remove-assign-users/${permissionId}`,
    );
  }
}
