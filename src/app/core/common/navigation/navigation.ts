import { NgClass } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { AuthService } from 'app/core/services/auth.service';
import { NavigationService } from 'app/core/services/navigation.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { DeviceDetectorService, DeviceType } from 'ngx-device-detector';
import { filter, map, Subject } from 'rxjs';

@Component({
  selector: 'navigation-component',
  templateUrl: './navigation.html',
  imports: [RouterLink, NgClass],
})
export class VerticalNavigation implements OnInit, OnDestroy {
  // currrentNavigation = signal<NavigationI | null>(null);

  previewType = computed(() => {
    const { deviceType } = this._deviceDetectorService.deviceInfo();
    switch (deviceType) {
      case DeviceType.Mobile:
        return 'mobile';
      case DeviceType.Tablet:
        return 'tablet';
      case DeviceType.Desktop:
        return 'desktop';
      default:
        return 'desktop';
    }
  });

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _parameterService = inject(ParameterService);
  private _authService = inject(AuthService);
  private _router = inject(Router);
  private _navigationService = inject(NavigationService);
  private _deviceDetectorService = inject(DeviceDetectorService);

  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });
  readonly navigation = toSignal(this._navigationService.navigation$, { initialValue: [] });
  readonly isOpen = toSignal(this._navigationService.isOpenNavigation$, { initialValue: false });

  readonly currentPath = toSignal(
    this._router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.replace(/^\/admin\//, '')),
    ),
    {
      initialValue: window.location.pathname.replace(/^\/admin\//, ''),
    },
  );
  readonly currrentNavigation = computed(() => {
    return this._navigationService.getCurrentNavigation(this.navigation(), this.currentPath());
  });

  /**
   * Constructor
   */
  constructor() {
    const { deviceType } = this._deviceDetectorService.deviceInfo();
    if (deviceType === DeviceType.Desktop) {
      this._navigationService._isOpenNavigation.next(true);
    } else {
      this._navigationService._isOpenNavigation.next(false);
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {}

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
   * Get parameter
   * @param code
   */
  getParameter(code: string) {
    if (this.parameters().length > 0) {
      return findParameter(code, this.parameters())?.value;
    }

    return '';
  }

  /**
   * Get logo
   * @param code
   * @returns
   */
  getLogo(code: string) {
    return `${this.getParameter('APP_STATICS_URL')}/${this.getParameter(code)}`;
  }

  /**
   * Sign out
   */
  signOut(): void {
    const token = this._authService.accessToken;
    this._authService.signOut();
    this._authService.logout(token).subscribe({
      next: () => {
        this._router.navigate(['/auth/sign-out']);
      },
    });
  }

  /**
   * Close navigation
   */
  closePanel() {
    this._navigationService._isOpenNavigation.next(false);
  }

  /**
   *
   */
  toggleNavigation() {
    if (this.previewType() !== 'desktop') {
      this.closePanel();
    }
  }
}
