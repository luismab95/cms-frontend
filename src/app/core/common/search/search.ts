import {
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavigationI } from '@core/interfaces';
import { NavigationService } from '@core/services';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'search-component',
  templateUrl: './search.html',
  imports: [RouterLink, NgClass],
})
export class Search implements OnDestroy {
  private readonly searchOrigin = viewChild.required<ElementRef<HTMLElement>>('searchOrigin');
  private readonly searchPanel = viewChild.required<TemplateRef<any>>('searchPanel');

  navigationSearch = signal<NavigationI[]>([]);
  searchValue = signal<string>('');
  currrentNavigation = signal<NavigationI | null>(null);

  readonly totalResults = computed(
    () => this.navigationSearch().flatMap((nav) => nav.children ?? []).length,
  );

  private _overlayRef!: OverlayRef;

  private _destroyRef = inject(DestroyRef);
  private _overlay = inject(Overlay);
  private _viewContainerRef = inject(ViewContainerRef);
  private _navigationService = inject(NavigationService);

  readonly navigation = this._navigationService.navigation;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const navigation = this.navigation();
      const currentPath = window.location.pathname.replace(/^\/admin\//, '');
      this.currrentNavigation.set(
        this._navigationService.getCurrentNavigation(navigation, currentPath),
      );
    });

    toObservable(this.searchValue)
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this._destroyRef))
      .subscribe((term) => {
        this.search(term);
      });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    if (this._overlayRef) {
      this._overlayRef.dispose();
    }
  }

  /**
   * Open the notifications panel
   */
  openPanel(): void {
    if (!this.searchPanel() || !this.searchOrigin()) return;
    if (!this._overlayRef) this._createOverlay();
    this._overlayRef.attach(new TemplatePortal(this.searchPanel(), this._viewContainerRef));
  }

  /**
   * Close the notifications panel
   */
  closePanel(): void {
    this._overlayRef.detach();
  }

  /**
   * On search event
   * @param event
   */
  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchValue.set(input.value);
  }

  /**
   * Clear input search
   * @param input
   */
  clearSearch(input: HTMLInputElement): void {
    input.value = '';
    input.focus();
    this.closePanel();
  }

  /**
   * Create the overlay
   */
  private _createOverlay(): void {
    // Create the overlay
    this._overlayRef = this._overlay.create({
      hasBackdrop: true,
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay
        .position()
        .flexibleConnectedTo(this.searchOrigin().nativeElement)
        .withLockedPosition(true)
        .withPush(true)
        .withPositions([
          {
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
          },
        ]),
    });

    this._overlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        this._overlayRef.detach();
      });
  }

  /**
   * Search navigation
   * @param term
   * @returns
   */
  private search(term: string): void {
    const query = term.trim();

    if (!query) {
      this.navigation.set([]);
      return;
    }

    const result = this.filterNavigation(this.navigation(), query);
    this.navigationSearch.set(result);
    this.openPanel();
  }

  /**
   * Filter recursive
   * @param navigation
   * @param search
   * @returns
   */
  filterNavigation(navigation: NavigationI[], search: string): NavigationI[] {
    const term = search.trim().toLowerCase();
    if (!term) return navigation;

    const result: NavigationI[] = [];
    for (const item of navigation) {
      const matchesTitle = item.title.toLowerCase().includes(term);
      const matchesSubtitle = item.subtitle?.toLowerCase().includes(term) ?? false;
      const filteredChildren: NavigationI[] = item.children
        ? this.filterNavigation(item.children, term)
        : [];
      if (matchesTitle || matchesSubtitle || filteredChildren.length > 0) {
        const filteredItem: NavigationI = {
          ...item,
        };
        if (item.children) filteredItem.children = filteredChildren;
        result.push(filteredItem);
      }
    }
    return result;
  }
}
