import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { DeviceDetectorService, DeviceType } from 'ngx-device-detector';
import { PageService, TemplateService } from '@core/services';
import { TemplateI, PageI, PageDetailReferenceI } from '@core/interfaces';
import { GridComponent } from '@shared/components';
import { distinctUntilChanged, filter } from 'rxjs';

@Component({
  selector: 'landing-router',
  templateUrl: './router.html',
  imports: [GridComponent],
})
export class LandingRouterComponent implements OnInit {
  loading = signal<boolean>(true);
  previousLangValue = signal<string>(window.location.pathname.split('/')[1]);

  languageId = signal<number | undefined>(undefined);
  lang = signal<string | undefined>(undefined);
  page = signal<string | null>(null);
  micrositie = signal<string | null>(null);

  private readonly _deviceDetectorService = inject(DeviceDetectorService);
  private readonly _pageService = inject(PageService);
  private readonly _templateService = inject(TemplateService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);
  private readonly _metaService = inject(Meta);
  private readonly _titleService = inject(Title);

  readonly previewType = computed(() => {
    const { deviceType } = this._deviceDetectorService.deviceInfo();
    switch (deviceType) {
      case DeviceType.Mobile:
        return 'mobile';
      case DeviceType.Tablet:
        return 'tablet';
      case DeviceType.Desktop:
        return 'desktop';
      default:
        return 'desktop';
    }
  });

  /**
   * Constructor
   */
  constructor() {
    this._router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        distinctUntilChanged(),
      )
      .subscribe((event: NavigationEnd) => {
        const urlSplit = event.urlAfterRedirects.split('/');
        const lang = urlSplit[1];
        if (!this.loading() && lang !== this.previousLangValue()) {
          this.previousLangValue.set(lang);
          this._router
            .navigateByUrl(`/${lang}/${urlSplit.slice(2).join('/')}`)
            .then(() => this.getPage());
        }
      });
  }

  /**
   * On init
   */
  ngOnInit(): void {
    this.getPage();
  }

  /**
   * Get page
   */
  getPage() {
    this.loading.set(true);
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
          this.loadData(res.message.template, 'template');
          this.loadData(res.message, 'page');
          this.loading.set(false);
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
   * Set data to grid
   * @param data
   * @param item
   */
  loadData(data: TemplateI | PageI, item: 'template' | 'page') {
    if (item === 'page') this._pageService.page.set(data as PageI);
    if (item === 'template') this._templateService.template.set(data as TemplateI);
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
