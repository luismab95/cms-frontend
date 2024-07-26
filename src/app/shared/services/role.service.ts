import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { RoleI } from 'app/core/user/user.types';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RoleService {
    private url = environment.apiUrl;
    private _roles: ReplaySubject<RoleI[]> = new ReplaySubject<RoleI[]>(1);
    private _httpClient = inject(HttpClient);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set roles(value: RoleI[]) {
        // Store the value
        this._roles.next(value);
    }

    get roles$(): Observable<RoleI[]> {
        return this._roles.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all roles
     * @returns
     */
    getAll(): Observable<ResponseI<RoleI[]>> {
        return this._httpClient
            .get<ResponseI<RoleI[]>>(`${this.url}/ms-security/roles`)
            .pipe(
                tap((response) => {
                    this._roles.next(response.message);
                })
            );
    }
}
