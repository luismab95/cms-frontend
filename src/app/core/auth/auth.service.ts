import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot } from '@angular/router';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { StorageUtils } from 'app/shared/utils/storage.util';
import { environment } from 'environments/environment';
import { DeviceDetectorService } from 'ngx-device-detector';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private url = environment.apiUrl;
    private _httpClient = inject(HttpClient);

    constructor(
        private _deviceService: DeviceDetectorService,
        private _storageUtils: StorageUtils
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        this._storageUtils.saveLocalStorage('accessToken', token);
    }

    get accessToken(): string {
        return this._storageUtils.getLocalStorage('accessToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<ResponseI<string>> {
        return this._httpClient.post<ResponseI<string>>(
            `${this.url}/ms-auth/auth/forgot-password`,
            { email }
        );
    }

    /**
     * Reset password
     *
     * @param password
     * @param token
     */
    resetPassword(
        password: string,
        token: string
    ): Observable<ResponseI<string>> {
        return this._httpClient.patch<ResponseI<string>>(
            `${this.url}/ms-auth/auth/reset-password`,
            { password, token }
        );
    }

    /**
     * Delete session
     *
     * @param token
     */
    logout(token: string): Observable<ResponseI<string>> {
        return this._httpClient.delete<ResponseI<string>>(
            `${this.url}/ms-auth/auth/sign-out/${token}`,
            {}
        );
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(
        credentials: {
            email: string;
            password: string;
        },
        ip: string
    ): Observable<ResponseI<string>> {
        const deviceInfo = Object.entries(this._deviceService.getDeviceInfo())
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        const headers = new HttpHeaders({
            'x-device-info': deviceInfo,
            'x-client-ip': ip,
        });

        return this._httpClient.post<ResponseI<string>>(
            `${this.url}/ms-auth/auth/login`,
            credentials,
            { headers }
        );
    }

    /**
     * Sign in two factor auth
     *
     * @param credentials
     */
    twoFactorAuth(
        credentials: {
            email: string;
            otp: string;
        },
        ip: string
    ): Observable<ResponseI<string>> {
        const deviceInfo = Object.entries(this._deviceService.getDeviceInfo())
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');

        const headers = new HttpHeaders({
            'x-device-info': deviceInfo,
            'x-client-ip': ip,
        });

        return this._httpClient.post<ResponseI<string>>(
            `${this.url}/ms-auth/auth/two-factor`,
            credentials,
            { headers }
        );
    }

    /**
     * Sign out
     */
    signOut(): Observable<boolean> {
        // Remove the access token from the local storage
        this._storageUtils.deleteKeyStorage('accessToken');
        this._storageUtils.deleteKeyStorage('actions');
        this._storageUtils.deleteKeyStorage('navigation');

        // Return the observable
        return of(true);
    }

    /**
     * Check the authentication status
     */ navigation;
    check(): Observable<boolean> {
        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }

        return of(true);
    }

    /**
     * Check the authentication pages
     */
    checkMenu(route: RouterStateSnapshot): Observable<boolean> {
        let findUrlNavigation: boolean = false;
        const navigations = JSON.parse(
            this._storageUtils.getLocalStorage('navigation') ?? '[]'
        ) as FuseNavigationItem[];

        if (navigations.length === 0) {
            return of(true);
        }

        navigations.forEach((navigation: FuseNavigationItem) => {
            navigation.children.forEach((child: FuseNavigationItem) => {
                if (route.url.includes(child.link)) {
                    findUrlNavigation = true;
                }
            });
        });

        return of(findUrlNavigation);
    }
}
