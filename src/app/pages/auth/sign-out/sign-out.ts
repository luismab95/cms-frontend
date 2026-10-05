import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ParameterService } from '@core/services';
import { AuthComponent } from '@shared/components';
import { getLogo, findParameter } from '@shared/utils';
import { finalize, Subscription, takeWhile, tap, timer } from 'rxjs';

@Component({
  selector: 'auth-sign-out',
  templateUrl: './sign-out.html',
  imports: [RouterLink, AuthComponent],
})
export class AuthSignOut {
  countdown = signal<number>(6);
  countdownMapping = {
    '=1': '# second',
    other: '# seconds',
  };

  progressPercentage = computed(() => {
    return (this.countdown() / 6) * 100;
  });

  private readonly _parameterService = inject(ParameterService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);

  private readonly countdownSubscription: Subscription;

  readonly parameters = this._parameterService.publicParameters;

  /**
   * Constructor
   */
  constructor() {
    this.countdownSubscription = timer(1000, 1000)
      .pipe(
        takeWhile(() => this.countdown() > 0),
        takeUntilDestroyed(this._destroyRef),
        tap(() => this.countdown.update((value) => value - 1)),
        finalize(() => {
          if (this.countdown() === 0) {
            this._router.navigate(['auth/sign-in']);
          }
        }),
      )
      .subscribe();
  }

  /**
   * Get value of auth background
   * @returns
   */
  getLogo() {
    if (this.parameters().length > 0) return getLogo('LOGO_PRIMARY', this.parameters());
    return '';
  }

  /**
   * Get company parameters
   * @returns
   */
  getCompanyInfo() {
    return findParameter('COMPANY_NAME', this.parameters())?.value;
  }

  /**
   * Stop countdown
   */
  stop() {
    this.countdownSubscription.unsubscribe();
  }
}
