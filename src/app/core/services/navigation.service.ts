import { Injectable } from '@angular/core';
import { NavigationI } from '../interfaces/navigation.interface';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  public _navigation: ReplaySubject<NavigationI[]> = new ReplaySubject<NavigationI[]>(1);
  public _isOpenNavigation: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Getter for navigation
   */
  get navigation$(): Observable<NavigationI[]> {
    return this._navigation.asObservable();
  }

  /**
   * Getter for isOpenNavigation
   */
  get isOpenNavigation$(): Observable<boolean> {
    return this._isOpenNavigation.asObservable();
  }

  /**
   * Setter & getter for isOpenNavigation
   * @param value
   */
  set isOpenNavigation(value: boolean) {
    this._isOpenNavigation.next(value);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  getCurrentNavigation(items: NavigationI[], link: string): NavigationI | null {
    for (const item of items) {
      if (item.link === link) {
        return item;
      }

      if (item.children?.length) {
        const found = this.getCurrentNavigation(item.children, link);

        if (found) {
          return found;
        }
      }
    }

    return null;
  }
}
