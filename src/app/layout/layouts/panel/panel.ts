import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoaderComponent, LoadingBarComponent, DialogComponent } from '@shared/components';
import { Notifications, User, VerticalNavigation, Search } from '@core/common';
import { NavigationService, ParameterService } from '@core/services';

@Component({
  selector: 'panel-layout',
  templateUrl: './panel.html',
  imports: [
    Notifications,
    User,
    VerticalNavigation,
    Search,
    RouterOutlet,
    LoaderComponent,
    LoadingBarComponent,
    DialogComponent,
  ],
})
export class PanelLayout {
  isLoader = signal<boolean>(true);

  private readonly _navigationService = inject(NavigationService);
  private readonly _parameterService = inject(ParameterService);

  readonly parameters = this._parameterService.publicParameters;
  readonly isOpen = this._navigationService.isOpenNavigation;

  /**
   * Open/close navigation
   */
  toggleNavigation(): void {
    this.isOpen.update((value) => !value);
    this._navigationService.isOpenNavigation.set(this.isOpen());
  }

  /**
   * Stop Loader
   */
  stopLoader() {
    this.isLoader.set(false);
  }
}
