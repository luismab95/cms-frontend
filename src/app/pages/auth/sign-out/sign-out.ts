import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { ParameterService } from 'app/core/services/parameter.service';
import { AuthComponent } from 'app/shared/components/auth/auth';
import { findParameter, getLogo } from 'app/shared/utils/parameter.utils';
import { Subject, Subscription, finalize, takeUntil, takeWhile, tap, timer } from 'rxjs';

@Component({
  selector: 'auth-sign-out',
  templateUrl: './sign-out.html',
  imports: [RouterLink, AuthComponent],
})
export class AuthSignOut implements OnInit, OnDestroy {
  countdown = signal<number>(10);
  countdownMapping: any = {
    '=1': '# second',
    other: '# seconds',
  };
  parameters = signal<ParameterI[]>([]);

  progressPercentage = computed(() => {
    return (this.countdown() / 10) * 100;
  });

  private countdownSubscription?: Subscription;

  private _parameterService = inject(ParameterService);
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  private _router = inject(Router);
  private _changeDetectorRef = inject(ChangeDetectorRef);

  /**
   * Constructor
   */
  constructor() {
    this._parameterService.parameter$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((parameters: ParameterI[]) => {
        this.parameters.set(parameters);
        this._changeDetectorRef.markForCheck();
      });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Redirect after the countdown
    this.countdownSubscription = timer(1000, 1000)
      .pipe(
        takeWhile(() => this.countdown() > 0),
        takeUntil(this._unsubscribeAll),
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
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get value of auth background
   * @returns
   */
  getLogo() {
    if (this.parameters().length > 0) {
      return getLogo('LOGO_PRIMARY', this.parameters());
    } else {
      return '';
    }
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
    this.countdownSubscription?.unsubscribe();
  }
}
