import { Component, inject, computed, DestroyRef, effect } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { DeviceDetectorService, DeviceType } from 'ngx-device-detector';
import { ParameterService, AuthService, NavigationService } from '@core/services';
import { findParameter } from '@shared/utils';
import { filter, map } from 'rxjs';

@Component({
  selector: 'navigation-component',
  templateUrl: './navigation.html',
  imports: [RouterLink, NgClass],
})
export class VerticalNavigation {
  private _router = inject(Router);
  private _destroyRef = inject(DestroyRef);
  private _deviceDetectorService = inject(DeviceDetectorService);
  private _parameterService = inject(ParameterService);
  private _authService = inject(AuthService);
  private _navigationService = inject(NavigationService);

  readonly parameters = this._parameterService.publicParameters;
  readonly navigation = this._navigationService.navigation;
  readonly isOpen = this._navigationService.isOpenNavigation;

  readonly currentPath = toSignal(
    this._router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.replace(/^\/admin\//, '')),
    ),
    {
      initialValue: window.location.pathname.replace(/^\/admin\//, ''),
    },
  );

  readonly currentNavigation = computed(() =>
    this._navigationService.getCurrentNavigation(
      this._navigationService.navigation(),
      this.currentPath(),
    ),
  );

  readonly previewType = computed(() => {
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

  /**
   * Constructor
   */
  constructor() {
    this._navigationService.isOpenNavigation.set(this.previewType() === 'desktop');
  }

  /**
   * Get parameter
   * @param code
   */
  getParameter(code: string) {
    if (this.parameters().length > 0) return findParameter(code, this.parameters())?.value;
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
    this._authService
      .logout(token)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._router.navigate(['/auth/sign-out']);
        },
      });
  }

  /**
   * Close navigation
   */
  closePanel() {
    this._navigationService.isOpenNavigation.set(false);
  }

  /**
   * Toggle navigation
   */
  toggleNavigation() {
    if (this.previewType() !== 'desktop') this.closePanel();
  }
}
