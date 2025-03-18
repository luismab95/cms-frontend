import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { UserI } from 'app/core/user/user.types';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { Observable, Subject, lastValueFrom, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { findParameter } from '../utils/parameter.utils';

@Injectable({
    providedIn: 'root',
})
export class InactivityTimerService {
    private user: UserI;
    private _activity$: Subject<void> = new Subject<void>();
    private _inactivityTimer$!: Observable<number>;
    private _inactivityValue!: number;
    private _unsubscribe$: Subject<void> = new Subject<void>();

    constructor(
        private _authService: AuthService,
        private _userService: UserService,
        private _parameterService: ParameterService,
        private _router: Router
    ) {
        this.restartTimer();
        this.setValueTime();
        this._activity$.subscribe(() => this.restartTimer());
        this._userService.user$.subscribe((user: UserI) => {
            if (user) {
                this.user = user;
            }
        });
    }

    async setValueTime() {
        const response = await lastValueFrom(
            this._parameterService.getPublic()
        );
        const inactivityParam = findParameter(
            'APP_INACTIVITY',
            response.message
        )?.value;
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
                    const token = this._authService.accessToken;
                    if (token) {
                        const user = this.user;
                        await lastValueFrom(this._authService.logout(token));
                        this._authService.signOut();
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
