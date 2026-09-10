import { NgClass } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ChangeDetectorRef,
  computed,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NavigationI } from 'app/core/interfaces/navigation.interface';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { AuthService } from 'app/core/services/auth.service';
import { NavigationService } from 'app/core/services/navigation.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { DeviceDetectorService, DeviceType } from 'ngx-device-detector';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'navigation-component',
  templateUrl: './navigation.html',
  imports: [RouterLink, NgClass],
})
export class VerticalNavigation implements OnInit, OnDestroy {
  parameters = signal<ParameterI[]>([]);
  navigation = signal<NavigationI[]>([]);
  currrentNavigation = signal<NavigationI | null>(null);
  isOpen = signal<boolean>(true);

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
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _deviceDetectorService = inject(DeviceDetectorService);

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
  ngOnInit(): void {
    // Subscribe to  data
    this._parameterService.parameter$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: ParameterI[]) => {
        this.parameters.set(response);
        this._changeDetectorRef.markForCheck();
      });

    // Subscribe to  data
    this._navigationService.navigation$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((navigation: NavigationI[]) => {
        this.navigation.set(navigation);
        const currentPath = window.location.pathname.replace(/^\/admin\//, '');
        this.currrentNavigation.set(
          this._navigationService.getCurrentNavigation(navigation, currentPath),
        );
        this._changeDetectorRef.markForCheck();
      });

    this._navigationService.isOpenNavigation$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((response: boolean) => {
        this.isOpen.set(response);
        this._changeDetectorRef.markForCheck();
      });
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
   * Set Current Navigation
   * @param nav
   */
  setNavigation(nav: NavigationI) {
    this.currrentNavigation.set(nav);
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
    this.isOpen.set(false);
    this._navigationService._isOpenNavigation.next(this.isOpen());
  }
}
