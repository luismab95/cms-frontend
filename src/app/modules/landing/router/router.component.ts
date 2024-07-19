import {
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { GridComponent } from 'app/shared/components/grid/grid.component';
import { generateRandomString } from 'app/shared/utils/random.utils';
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
    previewType = signal<any>('none');
    private _fuseMediaWatcherService = inject(FuseMediaWatcherService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor() {
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
        // Set header
        this.setGrid(
            [
                {
                    uuid: generateRandomString(8),
                    css: {},
                    config: {},
                    rows: [
                        {
                            uuid: generateRandomString(8),
                            css: {},
                            config: {},
                            columns: [
                                {
                                    uuid: generateRandomString(8),
                                    css: {},
                                    config: {},
                                    element: null,
                                },
                            ],
                        },
                    ],
                },
            ],
            'header'
        );

        // Set body
        this.setGrid(
            [
                {
                    uuid: generateRandomString(8),
                    css: {},
                    config: {},
                    rows: [
                        {
                            uuid: generateRandomString(8),
                            css: {},
                            config: {},
                            columns: [
                                {
                                    uuid: generateRandomString(8),
                                    css: {},
                                    config: {},
                                    element: {
                                        uuid: generateRandomString(8),
                                        name: 'Boton',
                                        css: {},
                                        config: {},
                                        text: {
                                            ref: 'lorem ipsum...',
                                        },
                                    },
                                },
                                {
                                    uuid: generateRandomString(8),
                                    css: {},
                                    config: {},
                                    element: {
                                        uuid: generateRandomString(8),
                                        name: 'Boton',
                                        css: {},
                                        config: {},
                                        text: {
                                            ref: 'lorem ipsum...',
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
            'body'
        );

        // Set footer
        this.setGrid(
            [
                {
                    uuid: generateRandomString(8),
                    css: {},
                    config: {},
                    rows: [
                        {
                            uuid: generateRandomString(8),
                            css: {},
                            config: {},
                            columns: [
                                {
                                    uuid: generateRandomString(8),
                                    css: {},
                                    config: {},
                                    element: null,
                                },
                            ],
                        },
                    ],
                },
            ],
            'footer'
        );

        // Load CSS
        const styleElement = document.createElement('style');
        styleElement.textContent = `.header {
     background-color: #333; /* Background color */
     color: #fff; /* Text color */
     padding: 20px 0; /* Padding around content */
     text-align: center; /* Center align text */
 } .body {
            font-family: Arial, sans-serif; /* Example font stack */
            line-height: 1.6; /* Example line height */
            background-color: #f0f0f0; /* Example background color */
            color: #333; /* Example text color */
            margin: 0; /* Remove default margin */
            padding: 0; /* Remove default padding */
            height: 600px; /* height */
            width: 100%; /* width */
        }
     .footer {
     background-color: #333; /* Background color */
     color: #fff; /* Text color */
     padding: 20px 0; /* Padding around content */
     text-align: center; /* Center align text */
     width: 100%; /* Full width */
 }`;
        document.head.appendChild(styleElement);
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
     * Set data to grid
     * @param grid
     * @param item
     */
    setGrid(grid: any, item: 'header' | 'footer' | 'body') {
        if (item === 'header') this.header.set(grid);
        if (item === 'footer') this.footer.set(grid);
        if (item === 'body') this.body.set(grid);
    }
}
