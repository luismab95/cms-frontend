import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { UserI, RoleI, PermissionI, SessionUserI } from '@core/interfaces';
import { PaginationResponseI, PaginationResquestI, ResponseI } from '@shared/interfaces';
import { buildQueryParams, DefaultPaginationParams, StorageUtils } from '@shared/utils';
import { NavigationService } from './navigation.service';
import { environment } from 'environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  users = signal<PaginationResponseI<UserI[]>>(DefaultPaginationParams<UserI[]>());
  user = signal<UserI | null>(null);
  userLogin = signal<UserI | null>(null);
  role = signal<RoleI | null>(null);
  permission = signal<PermissionI | null>(null);

  private readonly prefix = 'ms-security';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);
  private readonly _navigationService = inject(NavigationService);
  private readonly _storageUtils = inject(StorageUtils);

  /**
   * Get all users
   * @param params
   * @returns
   */
  getAll(params: PaginationResquestI): Observable<ResponseI<PaginationResponseI<UserI[]>>> {
    const queryParams = buildQueryParams(params);
    return this._httpClient
      .get<ResponseI<PaginationResponseI<UserI[]>>>(
        `${this.url}/${this.prefix}/users${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this.users.set(response.message);
        }),
      );
  }

  /**
   * Get the current signed-in user data
   */
  getSession(): Observable<ResponseI<SessionUserI>> {
    return this._httpClient
      .get<ResponseI<SessionUserI>>(`${this.url}/${this.prefix}/users/session`)
      .pipe(
        tap((response) => {
          this.userLogin.set(response.message.user);
          this.role.set(response.message.role);
          this._navigationService.navigation.set(response.message.navigation);
          this.permission.set(response.message.permission);
          this._storageUtils.saveLocalStorage(
            'actions',
            JSON.stringify(response.message.permission.scope[0].action),
          );
          this._storageUtils.saveLocalStorage(
            'navigation',
            JSON.stringify(response.message.navigation),
          );
        }),
      );
  }

  /**
   * Create the user
   * @param user
   * @returns
   */
  create(user: UserI): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(`${this.url}/${this.prefix}/users`, user);
  }

  /**
   * Delete the user
   * @param userId
   * @returns
   */
  delete(userId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(`${this.url}/${this.prefix}/users/${userId}`);
  }

  /**
   * Update the user
   * @param userId
   * @param user
   * @returns
   */
  update(userId: number, user: UserI): Observable<ResponseI<UserI>> {
    return this._httpClient
      .patch<ResponseI<UserI>>(`${this.url}/${this.prefix}/users/${userId}`, user)
      .pipe(
        tap((response) => {
          this.user.set(response.message);
        }),
      );
  }
}
