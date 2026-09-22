import { Component, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NavigationI } from 'app/core/interfaces/navigation.interface';
import { NavigationService } from 'app/core/services/navigation.service';

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

  readonly navigations = toSignal(this._navigationService.navigation$, { initialValue: [] });

  /**
   *
   */
  constructor() {
    effect(() => {
      const navigations = this.navigations();

      let currentLink = this._router.url.replace('/admin/', '');
      // PARA DETALLE DE PAGINAS EN MICROSITIOS
      if (currentLink === 'content/microsities/detail') {
        currentLink = 'content/pages';
      }

      const currentNavigation = this._navigationService.getCurrentNavigation(
        navigations,
        currentLink,
      );
      this.navigation.set(currentNavigation);
    });
  }
}
