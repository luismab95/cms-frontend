import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { PageService } from 'app/core/services/pages.service';
import { DeviceDetectorService, DeviceType } from 'ngx-device-detector';
import { Subject, takeUntil } from 'rxjs';
import { PageDetailReferenceI } from 'app/core/interfaces/page.interface';

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
  imports: [],
})
export class LandingRouterComponent implements OnInit, OnDestroy {
  header = signal<any>([]);
  body = signal<any>([]);
  footer = signal<any>([]);
  loading = signal<boolean>(true);
  languageId!: number;
  lang!: string;
  page: string | null = null;
  micrositie: string | null = null;
  interval: any;

  private _unsubscribeAll: Subject<any> = new Subject<any>();
  private previousLangValue: string | null = localStorage.getItem('lang');

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
  constructor() {}

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
    if (this.interval) clearInterval(this.interval);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Toggle language
   */
  toggleLanguage() {
    const url = window.location.pathname;
    const urlSplit = url.split('/');

    this.interval = setInterval(() => {
      const currentLangValue = localStorage.getItem('lang');
      if (!this.loading() && currentLangValue !== this.previousLangValue) {
        this.previousLangValue = currentLangValue;
        this._router
          .navigateByUrl(`/${currentLangValue}/${urlSplit.slice(2).join('/')}`)
          .then(() => this.getPage());
      }
    }, 1000);
  }

  /**
   * Get page
   */
  getPage() {
    this.loading.set(true);
    const url = window.location.pathname;
    const urlSplit = url.split('/');

    switch (urlSplit.length) {
      case 2:
        this.lang = urlSplit[1];
        break;
      case 3:
        this.page = urlSplit[2];
        this.lang = urlSplit[1];
        break;
      case 4:
        this.page = urlSplit[3];
        this.lang = urlSplit[1];
        this.micrositie = urlSplit[2];
    }

    this._pageService
      .getPage({
        lang: this.lang,
        page: this.page!,
        micrositie: this.micrositie!,
      })
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (res) => {
          this.languageId = res.message.languageId;
          this.previousLangValue = res.message.languageCode;
          localStorage.setItem('lang', res.message.languageCode);

          this.updateMetaTags(this.languageId, res.message.details!);

          this.setGrid(res.message.template.data?.header.data, 'header');
          this.setGrid(res.message.data?.body.data, 'body');
          this.setGrid(res.message.template.data?.footer.data, 'footer');

          // Load CSS
          const styleElement = document.createElement('style');
          styleElement.textContent = `${res.message.data?.body.css} ${res.message.template.data?.header.css} ${res.message.template.data?.footer.css}`;
          document.head.appendChild(styleElement);
          this.loading.set(false);
          if (!this.interval) this.toggleLanguage();
        },
        error: (err) => {
          if (err.status === 503) {
            this._router.navigateByUrl('/maintenance');
          } else if (err.status === 404) {
            this._router.navigateByUrl('/404-not-found');
          } else this._router.navigateByUrl('/500-error');
        },
      });
  }

  /**
   * Set data to grid
   * @param grid
   * @param item
   */
  setGrid(grid: any, item: 'header' | 'footer' | 'body') {
    if (item === 'header') this.header.set(grid);
    if (item === 'body') this.body.set(grid);
    if (item === 'footer') this.footer.set(grid);
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
