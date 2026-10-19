import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { AuthUtils, StorageUtils } from '@shared/utils';
import { ResponseI } from '@shared/interfaces';
import { environment } from 'environments/environment';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly prefix = 'ms-auth';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);
  private readonly _deviceService = inject(DeviceDetectorService);
  private readonly _storageUtils = inject(StorageUtils);

  /**
   * Setter for access token
   * @param token
   */
  set accessToken(token: string) {
    this._storageUtils.saveLocalStorage('accessToken', token);
  }

  /**
   * Getter for access token
   * @returns
   */
  get accessToken(): string {
    return this._storageUtils.getLocalStorage('accessToken') ?? '';
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Forgot password
   * @param email
   * @returns
   */
  forgotPassword(email: string): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(
      `${this.url}/${this.prefix}/auth/forgot-password`,
      {
        email,
      },
    );
  }

  /**
   * Reset password
   * @param password
   * @param token
   * @returns
   */
  resetPassword(password: string, token: string): Observable<ResponseI<string>> {
    return this._httpClient.patch<ResponseI<string>>(
      `${this.url}/${this.prefix}/auth/reset-password`,
      {
        password,
        token,
      },
    );
  }

  /**
   * Delete session
   * @param token
   * @returns
   */
  logout(token: string): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(
      `${this.url}/${this.prefix}/auth/sign-out/${token}`,
      {},
    );
  }

  /**
   * Sign in
   * @param credentials
   * @param ip
   * @returns
   */
  signIn(
    credentials: {
      email: string;
      password: string;
    },
    ip: string,
  ): Observable<ResponseI<string>> {
    const deviceInfo = Object.entries(this._deviceService.deviceInfo())
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const headers = new HttpHeaders({
      'x-device-info': deviceInfo,
      'x-client-ip': ip,
    });

    return this._httpClient.post<ResponseI<string>>(
      `${this.url}/${this.prefix}/auth/login`,
      credentials,
      {
        headers,
      },
    );
  }

  /**
   * Sign in two factor auth
   * @param credentials
   * @returns
   */
  twoFactorAuth(
    credentials: {
      email: string;
      otp: string;
    },
    ip: string,
  ): Observable<ResponseI<string>> {
    const deviceInfo = Object.entries(this._deviceService.deviceInfo())
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    const headers = new HttpHeaders({
      'x-device-info': deviceInfo,
      'x-client-ip': ip,
    });

    return this._httpClient.post<ResponseI<string>>(
      `${this.url}/${this.prefix}/auth/two-factor`,
      credentials,
      { headers },
    );
  }

  /**
   * Send a new OTP code
   * @param credentials
   * @returns
   */
  resendOtp(email: string): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(`${this.url}/${this.prefix}/auth/resend-otp`, {
      email,
    });
  }

  /**
   * Sign out
   * @returns
   */
  signOut(): Observable<boolean> {
    this._storageUtils.deleteKeyStorage('accessToken');
    this._storageUtils.deleteKeyStorage('actions');
    this._storageUtils.deleteKeyStorage('navigation');
    return of(true);
  }

  /**
   * Check the authentication status
   * @returns
   */
  checkAuthStatus(): Observable<boolean> {
    if (!this.accessToken) return of(false);
    if (AuthUtils.isTokenExpired(this.accessToken)) return of(false);
    return of(true);
  }

  /**
   * Check the authentication pages
   * @param route
   * @returns
   */
  checkNavigation(route: RouterStateSnapshot): Observable<boolean> {
    let findUrlNavigation: boolean = false;
    const navigations = JSON.parse(
      this._storageUtils.getLocalStorage('navigation') ?? '[]',
    ) as any[];

    if (navigations.length === 0) return of(true);

    navigations.forEach((navigation: any) => {
      navigation.children.forEach((child: any) => {
        if (route.url.includes(child.link)) {
          findUrlNavigation = true;
        }
      });
    });

    return of(findUrlNavigation);
  }
}
