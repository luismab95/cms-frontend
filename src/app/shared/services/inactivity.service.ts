import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, Subject, lastValueFrom, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { findParameter } from '../utils/parameter.utils';
import { AuthService } from 'app/core/services/auth.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { UserService } from 'app/core/services/user.service';
import { UserI } from 'app/core/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class InactivityTimerService {
  private user!: UserI;
  private _activity$: Subject<void> = new Subject<void>();
  private _inactivityTimer$!: Observable<number>;
  private _inactivityValue!: number;
  private _unsubscribe$: Subject<void> = new Subject<void>();

  private _authService = inject(AuthService);
  private _userService = inject(UserService);
  private _parameterService = inject(ParameterService);
  private _router = inject(Router);

  constructor() {
    this.restartTimer();
    this.setValueTime();
    this._activity$.subscribe(() => this.restartTimer());
    this._userService.userLogin$.subscribe((user: UserI) => {
      if (user) {
        this.user = user;
      }
    });
  }

  async setValueTime() {
    const response = await lastValueFrom(this._parameterService.getPublic());
    const inactivityParam = findParameter('APP_INACTIVITY', response.message)?.value;
    this._inactivityValue = Number(inactivityParam) * 60 * 1000;
  }

  private async restartTimer() {
    if (this._inactivityTimer$) {
      this._unsubscribe$.next();
    }
    if (this._inactivityValue) {
      this._inactivityTimer$ = timer(this._inactivityValue);
      this._inactivityTimer$
        .pipe(takeUntil(this._activity$), takeUntil(this._unsubscribe$))
        .subscribe(async () => {
          const user = { ...this.user };
          const token = this._authService.accessToken;
          const url = window.location.pathname;
          const urlSplit = url.split('/');

          if (token && urlSplit[1] == 'admin') {
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
        });
    }
  }

  activityDetected(): void {
    this._activity$.next();
  }
}
