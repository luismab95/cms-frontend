import { Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService } from '@core/services/navigation.service';
import { NavigationI } from '@core/interfaces';

@Component({
  selector: 'title-header-component',
  templateUrl: './title-header.html',
})
export class TitleHeaderComponent {
  total = input.required<number | null>();
  info = input<string>('');

  navigation = signal<NavigationI | null>(null);

  private readonly _navigationService = inject(NavigationService);
  private readonly _router = inject(Router);

  readonly navigations = this._navigationService.navigation;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const navigations = this.navigations();
      let currentLink = this._router.url.replace('/admin/', '');
      if (currentLink === 'content/microsities/detail') currentLink = 'content/pages';
      const currentNavigation = this._navigationService.getCurrentNavigation(
        navigations,
        currentLink,
      );
      this.navigation.set(currentNavigation);
    });
  }
}
