import { Component, OnDestroy, OnInit, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { PageService } from 'app/core/services/pages.service';
import { DeviceDetectorService, DeviceType } from 'ngx-device-detector';
import { distinctUntilChanged, filter, Subject, takeUntil } from 'rxjs';
import { PageDetailReferenceI } from 'app/core/interfaces/page.interface';
import { GridComponent } from 'app/shared/components/grid/grid';
import { SectionI } from 'app/shared/interfaces/grid.interface';

@Component({
  selector: 'landing-router',
  templateUrl: './router.html',
  styles: `
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
      background-color: rgba(0, 0, 0, 0);
    }

    ::-webkit-scrollbar:hover {
      width: 8px;
      height: 8px;
      background-color: rgba(0, 0, 0, 0.06);
    }

    ::-webkit-scrollbar-thumb {
      border: 2px solid transparent;
      border-radius: 20px;
      box-shadow: inset 0 0 0 20px rgba(0, 0, 0, 0.24);
      cursor: pointer;
    }

    ::-webkit-scrollbar-thumb:active {
      border-radius: 20px;
      box-shadow: inset 0 0 0 20px rgba(0, 0, 0, 0.37);
    }
  `,
  imports: [GridComponent],
})
export class LandingRouterComponent implements OnInit, OnDestroy {
  loading = signal<boolean>(true);
  previousLangValue = signal<string>(window.location.pathname.split('/')[1]);

  languageId = signal<number | undefined>(undefined);
  lang = signal<string | undefined>(undefined);
  page = signal<string | null>(null);
  micrositie = signal<string | null>(null);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _deviceDetectorService = inject(DeviceDetectorService);
  private readonly _pageService = inject(PageService);
  private readonly _router = inject(Router);
  private _metaService = inject(Meta);
  private _titleService = inject(Title);

  previewType = computed(() => {
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
    // get page
    this.getPage();
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
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (res) => {
          this.languageId.set(res.message.languageId);

          this.updateMetaTags(this.languageId()!, res.message.details!);

          this.setGrid(res.message.template.data?.header.data!, 'header');
          this.setGrid(res.message.data?.body.data!, 'body');
          this.setGrid(res.message.template.data?.footer.data!, 'footer');

          // Load CSS
          const styleElement = document.createElement('style');
          styleElement.textContent = `${res.message.data?.body.css} ${res.message.template.data?.header.css} ${res.message.template.data?.footer.css}`;
          document.head.appendChild(styleElement);
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
   * @param grid
   * @param item
   */
  setGrid(grid: SectionI[], item: 'header' | 'footer' | 'body') {
    if (item === 'header') this._pageService.sectionsHeader = grid;
    if (item === 'body') this._pageService.sections = grid;
    if (item === 'footer') this._pageService.sectionsFooter = grid;
  }

  /**
   * Update meta
   * @param LanguageId
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
