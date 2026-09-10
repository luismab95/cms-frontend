import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Notifications } from 'app/core/common/notifications/notifications';
import { User } from 'app/core/common/user/user';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { VerticalNavigation } from 'app/core/common/navigation/navigation';
import { Search } from 'app/core/common/search/search';
import { ParameterService } from 'app/core/services/parameter.service';
import { NavigationService } from 'app/core/services/navigation.service';
import { LoaderComponent } from 'app/shared/components/loader/loader';
import { LoadingBarComponent } from 'app/shared/components/loading-bar/loading-bar';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'panel-layout',
  templateUrl: './panel.html',
  imports: [Notifications, User, VerticalNavigation, Search, RouterOutlet, LoaderComponent,LoadingBarComponent],
})
export class PanelLayout implements OnInit, OnDestroy {
  parameters = signal<ParameterI[]>([]);
  isOpen = signal<boolean>(true);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _navigationService = inject(NavigationService);
  private _parameterService = inject(ParameterService);
  private _changeDetectorRef = inject(ChangeDetectorRef);

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
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
   * Open/close navigation
   */
  toggleNavigation(): void {
    this.isOpen.update((value) => !value);
    this._navigationService._isOpenNavigation.next(this.isOpen());
  }
}
