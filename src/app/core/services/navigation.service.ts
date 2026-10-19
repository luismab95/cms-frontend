import { inject, Injectable, signal } from '@angular/core';
import { NavigationI } from '@core/interfaces';
import { StorageUtils } from '@shared/utils';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  navigation = signal<NavigationI[]>([]);
  isOpenNavigation = signal<boolean>(false);

  private readonly _storageUtils = inject(StorageUtils);

  /**
   * Set navigation
   * @param navigation 
   */
  setNavigation(navigation: NavigationI[]): void {
    this.navigation.set(navigation);
    this._storageUtils.saveLocalStorage('navigation', JSON.stringify(navigation));
  }

  /**
   * Get current link
   * @param items
   * @param link
   * @returns
   */
  getCurrentNavigation(items: NavigationI[], link: string): NavigationI | null {
    for (const item of items) {
      if (item?.link === link) return item;

      if (item.children?.length) {
        const found = this.getCurrentNavigation(item.children, link);
        if (found) return found;
      }
    }
    return null;
  }
}
