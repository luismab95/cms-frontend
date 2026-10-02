import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { RoleI } from '@core/interfaces';
import { ResponseI } from '@shared/interfaces';
import { environment } from 'environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleService {
  roles = signal<RoleI[]>([]);

  private readonly url = environment.apiUrl;
  private readonly prefix = 'ms-security';

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get all roles
   * @returns
   */
  getAll(): Observable<ResponseI<RoleI[]>> {
    return this._httpClient.get<ResponseI<RoleI[]>>(`${this.url}/${this.prefix}/roles`).pipe(
      tap((response) => {
        this.roles.set(response.message);
      }),
    );
  }
}
