import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  signal,
  DOCUMENT,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { ParameterService } from 'app/core/services/parameter.service';
import { EmptyLayout } from './layouts/empty/empty';
import { PanelLayout } from './layouts/panel/panel';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'layout',
  templateUrl: './layout.html',
  imports: [EmptyLayout, PanelLayout],
})
export class Layout implements OnInit, OnDestroy {
  parameters = signal<ParameterI[]>([]);
  currentLayout = signal<string>('default');

  private _parameterService = inject(ParameterService);
  private _changeDetectorRef = inject(ChangeDetectorRef);
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  /**
   * Constructor
   */
  constructor(
    private _activatedRoute: ActivatedRoute,
    @Inject(DOCUMENT) private _document: any,
    private _metaService: Meta,
    private _titleService: Title,
  ) {
    this._parameterService.parameter$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((parameters: ParameterI[]) => {
        this.parameters.set(parameters);
        this._changeDetectorRef.markForCheck();
        this.updateMetaTags();
      });

    this.currentLayout.set(this.getCurrentRouteLayout() ?? 'empty');
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {}

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  /**
   * Get parameter
   * @param code
   */
  getParameter(code: string) {
    if (this.parameters().length > 0) {
      return findParameter(code, this.parameters())?.value;
    }
    return null;
  }

  /**
   * Get current route layout from route data.
   */
  getCurrentRouteLayout(): string | null {
    let route: ActivatedRoute | null = this._activatedRoute;

    while (route) {
      const layout = route.snapshot.data['layout'];
      if (layout) {
        return layout;
      }
      route = route.firstChild ?? null;
    }

    return null;
  }

  /**
   * Update meta
   */
  updateMetaTags() {
    const companyName = this.getParameter('COMPANY_NAME') ?? 'CMS';
    const companyDescription = this.getParameter('COMPANY_DESCRIPTION') ?? '';
    const currentRoute = this._activatedRoute.snapshot.url.map((segment) => segment.path).join('/');

    let title = companyName;
    if (currentRoute === 'admin' || currentRoute === 'auth') {
      title = `Admin - ${companyName}`;
    }
    this._titleService.setTitle(title);
    this._metaService.updateTag({
      name: 'description',
      content: companyDescription,
    });
    this._metaService.updateTag({
      name: 'keywords',
      content: `CMS, ${companyName}`,
    });

    const link = this._document.createElement('link');
    link.rel = 'icon';
    link.href = `${this.getParameter('APP_STATICS_URL') ?? ''}/${this.getParameter('LOGO_ICON') ?? ''}`;
    link.type = 'image/x-icon';
    this._document.head.appendChild(link);
  }
}
