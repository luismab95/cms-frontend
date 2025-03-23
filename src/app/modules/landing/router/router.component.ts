import {
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { PageService } from 'app/modules/admin/pages/pages.service';
import { PageDetailReferenceI } from 'app/modules/admin/pages/pages.types';
import { GridComponent } from 'app/shared/components/grid/grid.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'landing-router',
    templateUrl: './router.component.html',
    encapsulation: ViewEncapsulation.None,
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
    standalone: true,
    imports: [GridComponent],
})
export class LandingRouterComponent implements OnInit, OnDestroy {
    header = signal<any>([]);
    body = signal<any>([]);
    footer = signal<any>([]);
    loading = signal<boolean>(true);
    previewType = signal<any>('none');
    languageId: number;
    lang: string;
    page: string | null = null;
    micrositie: string | null = null;

    interval: any;
    private previousLangValue: string | null = localStorage.getItem('lang');
    private _fuseMediaWatcherService = inject(FuseMediaWatcherService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    //TODO OBTENER PATH
    // CARGAR DATA DEL SERVICIO
    // CARGAR CSS

    /**
     * Constructor
     */
    constructor(
        private readonly _pageService: PageService,
        private readonly _router: Router,
        private _metaService: Meta,
        private _titleService: Title
    ) {
        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Check if the breakpoint is 'md' and up
                if (matchingAliases.length === 0) {
                    this.previewType.set('mobile');
                }
                if (matchingAliases.length === 1) {
                    this.previewType.set('tablet');
                }
                if (matchingAliases.length > 2) {
                    this.previewType.set('desktop');
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
            if (
                !this.loading() &&
                currentLangValue !== this.previousLangValue
            ) {
                this.previousLangValue = currentLangValue;
                this._router
                    .navigateByUrl(
                        `/${currentLangValue}/${urlSplit.slice(2).join('/')}`
                    )
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
                page: this.page,
                micrositie: this.micrositie,
            })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.languageId = res.message.languageId;
                    this.previousLangValue = res.message.languageCode;
                    localStorage.setItem('lang', res.message.languageCode);

                    this.updateMetaTags(this.languageId, res.message.details);

                    this.setGrid(
                        res.message.template.data.header.data,
                        'header'
                    );
                    this.setGrid(res.message.data.body.data, 'body');
                    this.setGrid(
                        res.message.template.data.footer.data,
                        'footer'
                    );

                    // Load CSS
                    const styleElement = document.createElement('style');
                    styleElement.textContent = `${res.message.data.body.css} ${res.message.template.data.header.css} ${res.message.template.data.footer.css}`;
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
        const findLanguage = details.find(
            (detail) => detail.languageId === languageId
        );

        this._titleService.setTitle(findLanguage.alias.text);
        this._metaService.updateTag({
            name: 'description',
            content: findLanguage.description.text,
        });
        this._metaService.updateTag({
            name: 'keywords',
            content: findLanguage.keywords.text,
        });
    }
}
