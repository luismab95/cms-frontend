import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
    PermissionI,
    RoleI,
    SessionUserI,
    UserI,
} from 'app/core/user/user.types';
import {
    PaginationResponseI,
    PaginationResquestI,
    ResponseI,
} from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';
import { NavigationService } from '../navigation/navigation.service';
import { Navigation } from '../navigation/navigation.types';

@Injectable({ providedIn: 'root' })
export class UserService {
    private url = environment.apiUrl;
    private _httpClient = inject(HttpClient);
    private _user: ReplaySubject<UserI> = new ReplaySubject<UserI>(1);
    private _users: ReplaySubject<PaginationResponseI<UserI[]>> =
        new ReplaySubject<PaginationResponseI<UserI[]>>(1);
    private _role: ReplaySubject<RoleI> = new ReplaySubject<RoleI>(1);
    private _permission: ReplaySubject<PermissionI> =
        new ReplaySubject<PermissionI>(1);
    private _navigationService = inject(NavigationService);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: UserI) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<UserI> {
        return this._user.asObservable();
    }

    /**
     * Setter & getter for role
     *
     * @param value
     */
    set role(value: RoleI) {
        // Store the value
        this._role.next(value);
    }

    get role$(): Observable<RoleI> {
        return this._role.asObservable();
    }

    /**
     * Setter & getter for navigation
     *
     * @param value
     */
    set permission(value: PermissionI) {
        // Store the value
        this._permission.next(value);
    }

    get permission$(): Observable<PermissionI> {
        return this._permission.asObservable();
    }

    /**
     * Setter & getter for users
     *
     * @param value
     */
    set users(value: PaginationResponseI<UserI[]>) {
        // Store the value
        this._users.next(value);
    }

    get users$(): Observable<PaginationResponseI<UserI[]>> {
        return this._users.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all users
     * @param params
     * @returns
     */
    getAll(
        params: PaginationResquestI
    ): Observable<ResponseI<PaginationResponseI<UserI[]>>> {
        let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
        if (params.search !== null) queryParams += `search=${params.search}&`;
        if (params.status !== null) queryParams += `status=${params.status}&`;

        return this._httpClient
            .get<
                ResponseI<PaginationResponseI<UserI[]>>
            >(`${this.url}/ms-security/users${queryParams}`)
            .pipe(
                tap((response) => {
                    this._users.next(response.message);
                })
            );
    }

    /**
     * Get the current signed-in user data
     */
    getSession(): Observable<ResponseI<SessionUserI>> {
        return this._httpClient
            .get<
                ResponseI<SessionUserI>
            >(`${this.url}/ms-security/users/session`)
            .pipe(
                tap((response) => {
                    this._user.next(response.message.user);
                    this._role.next(response.message.role);
                    const navigation: Navigation = {
                        compact: response.message.navigation,
                        default: response.message.navigation,
                        futuristic: response.message.navigation,
                        horizontal: response.message.navigation,
                    };
                    this._navigationService._navigation.next(navigation);
                    this._permission.next(response.message.permission);
                })
            );
    }

    /**
     * Create the user
     *
     * @param user
     */
    create(user: UserI): Observable<ResponseI<string>> {
        return this._httpClient.post<ResponseI<string>>(
            `${this.url}/ms-security/users`,
            { ...user }
        );
    }

    /**
     * Delete the user
     *
     * @param userId
     */
    delete(userId: number): Observable<ResponseI<string>> {
        return this._httpClient.delete<ResponseI<string>>(
            `${this.url}/ms-security/users/${userId}`
        );
    }

    /**
     * Update the user
     *
     * @param userId
     * @param user
     */
    update(userId: number, user: UserI): Observable<ResponseI<UserI>> {
        return this._httpClient
            .patch<
                ResponseI<UserI>
            >(`${this.url}/ms-security/users/${userId}`, { ...user })
            .pipe(
                tap((response) => {
                    this._user.next(response.message);
                })
            );
    }
}
