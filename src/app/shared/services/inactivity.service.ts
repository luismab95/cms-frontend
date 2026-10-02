import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, UserService, ParameterService } from '@core/services';
import { findParameter } from '@shared/utils';
import { Subject, lastValueFrom, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InactivityTimerService {
  private readonly _authService = inject(AuthService);
  private readonly _userService = inject(UserService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _router = inject(Router);

  private readonly _user = this._userService.userLogin;

  private readonly _inactivityValue = signal(0);

  private readonly _activity$ = new Subject<void>();
  private readonly _unsubscribe$ = new Subject<void>();

  readonly inactivityValue = this._inactivityValue.asReadonly();

  /**
   * Constructor
   */
  constructor() {
    this._activity$.subscribe(() => this.restartTimer());
    this.loadInactivityTime();
  }

  /**
   * Load time for inactivity
   */
  private async loadInactivityTime(): Promise<void> {
    const response = await lastValueFrom(this._parameterService.getPublic());
    const value = findParameter('APP_INACTIVITY', response.message)?.value;
    this._inactivityValue.set(Number(value) * 60 * 1000);
    this.restartTimer();
  }

  /**
   * Reset timer
   * @returns
   */
  private restartTimer(): void {
    this._unsubscribe$.next();

    const timeout = this._inactivityValue();
    if (!timeout) return;

    timer(timeout)
      .pipe(takeUntil(this._activity$), takeUntil(this._unsubscribe$))
      .subscribe(() => this.handleInactivity());
  }

  /**
   * Detect activity/inactivity
   * @returns
   */
  private async handleInactivity(): Promise<void> {
    const token = this._authService.accessToken;
    if (!token || !window.location.pathname.startsWith('/admin')) return;

    const user = this._user();
    if (!user) return;

    await lastValueFrom(this._authService.logout(token));
    await lastValueFrom(this._authService.signOut());
    this._router.navigate([
      'auth/unlock-session',
      {
        email: user.email,
        name: `${user.firstname} ${user.lastname}`,
      },
    ]);
  }

  /**
   * Detect activity
   */
  activityDetected(): void {
    this._activity$.next();
  }
}
