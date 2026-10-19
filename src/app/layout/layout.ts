import { Component, Inject, signal, DOCUMENT, inject, effect } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ParameterService } from '@core/services';
import { findParameter } from '@shared/utils';
import { EmptyLayout } from './layouts/empty/empty';
import { PanelLayout } from './layouts/panel/panel';

@Component({
  selector: 'layout',
  templateUrl: './layout.html',
  imports: [EmptyLayout, PanelLayout],
})
export class Layout {
  currentLayout = signal<string>('default');

  private readonly _parameterService = inject(ParameterService);
  private readonly _metaService = inject(Meta);
  private readonly _titleService = inject(Title);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _document = inject(DOCUMENT);

  readonly parameters = this._parameterService.publicParameters;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      this.parameters();
      this.updateMetaTags();
      this.currentLayout.set(this.getCurrentRouteLayout() ?? 'empty');
    });
  }

  /**
   * Get parameter
   * @param code
   * @returns
   */
  getParameter(code: string): string | null {
    if (this.parameters().length > 0) return findParameter(code, this.parameters())?.value ?? null;
    return null;
  }

  /**
   * Get current route layout from route data.
   * @returns
   */
  getCurrentRouteLayout(): string | null {
    let route: ActivatedRoute | null = this._activatedRoute;
    while (route) {
      const layout = route.snapshot.data['layout'];
      if (layout) return layout;
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
    if (currentRoute === 'admin' || currentRoute === 'auth') title = `Admin - ${companyName}`;

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
