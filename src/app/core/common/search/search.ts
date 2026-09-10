import {
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { NgClass } from '@angular/common';
import { NavigationService } from 'app/core/services/navigation.service';
import { NavigationI } from 'app/core/interfaces/navigation.interface';
import { ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'search-component',
  templateUrl: './search.html',
  imports: [RouterLink, NgClass],
})
export class Search implements OnInit, OnDestroy {
  @ViewChild('searchOrigin') private _searchOrigin!: ElementRef<HTMLElement>;
  @ViewChild('searchPanel')
  private _searchPanel!: TemplateRef<any>;

  navigation = signal<NavigationI[]>([]);
  navigationSearch = signal<NavigationI[]>([]);
  currrentNavigation = signal<NavigationI | null>(null);

  totalResults = computed(
    () => this.navigationSearch().flatMap((nav) => nav.children ?? []).length,
  );

  private _overlayRef!: OverlayRef;
  private searchSubject = new Subject<string>();
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _overlay = inject(Overlay);
  private _viewContainerRef = inject(ViewContainerRef);
  private _navigationService = inject(NavigationService);
  private _changeDetectorRef = inject(ChangeDetectorRef);

  /**
   * Constructor
   */
  constructor() {
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this._unsubscribeAll))
      .subscribe((term) => {
        this.search(term);
      });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
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
   * Open the notifications panel
   */
  openPanel(): void {
    // Return if the notifications panel or its origin is not defined
    if (!this._searchPanel || !this._searchOrigin) {
      return;
    }

    // Create the overlay if it doesn't exist
    if (!this._overlayRef) {
      this._createOverlay();
    }

    // Attach the portal to the overlay
    this._overlayRef.attach(new TemplatePortal(this._searchPanel, this._viewContainerRef));
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
    this.searchSubject.next(input.value);
  }

  /**
   * Clear input search
   * @param input
   */
  clearSearch(input: HTMLInputElement): void {
    input.value = '';
    input.focus();
    this.closePanel();
    this._changeDetectorRef.markForCheck();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

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
        .flexibleConnectedTo(this._searchOrigin.nativeElement)
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

    // Detach the overlay from the portal on backdrop click
    this._overlayRef.backdropClick().subscribe(() => {
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

    if (!term) {
      return navigation;
    }

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

        if (item.children) {
          filteredItem.children = filteredChildren;
        }

        result.push(filteredItem);
      }
    }

    return result;
  }
}
