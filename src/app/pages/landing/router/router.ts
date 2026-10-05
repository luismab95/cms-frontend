import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { DeviceDetectorService } from 'ngx-device-detector';
import { PageService, TemplateService } from '@core/services';
import { PageI, PageDetailReferenceI, PageRenderI } from '@core/interfaces';
import { GridComponent } from '@shared/components';
import { distinctUntilChanged, filter } from 'rxjs';

@Component({
  selector: 'landing-router',
  templateUrl: './router.html',
  imports: [GridComponent],
})
export class LandingRouterComponent {
  initializate = signal<boolean>(false);
  previousLangValue = signal<string>(window.location.pathname.split('/')[1]);
  languageId = signal<number>(0);
  lang = signal<string>('');
  page = signal<string>('');
  micrositie = signal<string>('');

  private readonly _pageService = inject(PageService);
  private readonly _templateService = inject(TemplateService);
  private readonly _deviceDetectorService = inject(DeviceDetectorService);
  private readonly _metaService = inject(Meta);
  private readonly _titleService = inject(Title);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly previewType = computed(() => {
    const { deviceType } = this._deviceDetectorService.deviceInfo();
    return deviceType;
  });

  readonly routerEvents = toSignal(
    this._router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      distinctUntilChanged(),
      takeUntilDestroyed(this._destroyRef),
    ),
  );

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const routerEvents = this.routerEvents();
      if (!routerEvents) return;

      const urlSplit = routerEvents.urlAfterRedirects.split('/');
      const lang = urlSplit[1];
      if (!this.initializate() && lang !== this.previousLangValue()) {
        this.previousLangValue.set(lang);
        this._router
          .navigateByUrl(`/${lang}/${urlSplit.slice(2).join('/')}`)
          .then(() => this.getPage());
      }
    });
    this.getPage();
  }

  /**
   * Get page
   */
  getPage() {
    const preview = this.loadParamsUrl();
    this._pageService
      .getPage({
        lang: this.lang()!,
        page: this.page()!,
        micrositie: this.micrositie()!,
        preview,
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (res) => {
          this.languageId.set(res.message.languageId);
          this.updateMetaTags(this.languageId()!, res.message.details!);
          this.loadData(res.message);
          this.initializate.set(true);
        },
        error: (err) => {
          if (err.status === 503) {
            this._router.navigateByUrl('/error/maintenance');
          } else if (err.status === 404) {
            this._router.navigateByUrl('/error/404');
          } else this._router.navigateByUrl('/error/500');
        },
      });
  }

  /**
   * Load info params for get page
   * @returns
   */
  loadParamsUrl(): boolean {
    let preview = false;
    const url = window.location.pathname;
    const urlSplit = url.split('/');

    if (urlSplit[2] === 'preview') {
      preview = true;
      urlSplit.splice(2, 1);
    }

    switch (urlSplit.length) {
      case 2:
        this.lang.set(urlSplit[1]);
        break;
      case 3:
        this.page.set(urlSplit[2]);
        this.lang.set(urlSplit[1]);
        break;
      case 4:
        this.page.set(urlSplit[3]);
        this.lang.set(urlSplit[1]);
        this.micrositie.set(urlSplit[2]);
    }

    return preview;
  }

  /**
   * Set data to grid
   * @param data
   * @param item
   */
  loadData(page: PageRenderI) {
    this._pageService.page.set(page as PageI);
    this._templateService.template.set(page.template);
  }

  /**
   * Update meta
   * @param languageId
   * @param details
   */
  updateMetaTags(languageId: number, details: PageDetailReferenceI[]) {
    const findLanguage = details.find((detail) => detail.languageId === languageId);
    this._titleService.setTitle(findLanguage?.alias.text!);
    this._metaService.updateTag({
      name: 'description',
      content: findLanguage?.description.text!,
    });
    this._metaService.updateTag({
      name: 'keywords',
      content: findLanguage?.keywords.text!,
    });
  }
}
