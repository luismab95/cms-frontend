import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewEncapsulation,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { MicrosityService } from 'app/modules/admin/microsities/micrositie.service';
import { MicrositieI } from 'app/modules/admin/microsities/micrositie.types';
import { GridComponent } from 'app/shared/components/grid/grid.component';
import { GridSettingsComponent } from 'app/shared/components/grid/settings/settings.component';
import { ModalService } from 'app/shared/services/modal.service';
import { generateRandomString } from 'app/shared/utils/random.utils';
import { Subject, takeUntil } from 'rxjs';
@Component({
    selector: 'pages-drawer',
    templateUrl: './drawer.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        NgClass,
        RouterLink,
        MatTooltipModule,
        GridComponent,
        MatMenuModule,
    ],
})
export class PagesDrawerComponent implements OnInit {
    @Input() page: any;
    @Input() template: any;
    @Output() fullscreemToggle: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    micrositie: MicrositieI;
    preview: string = 'none';
    previewMode: boolean = false;
    body = signal<any>([]);
    autosaveTimer: any;
    autosave = signal<boolean>(false);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _modalSvc: ModalService,
        private _microsityService: MicrosityService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        // Example autosave logic
        this.autosaveTimer = setInterval(() => {
            this.saveChanges();
        }, 10000);

        this._microsityService.micrositie$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((micrositie) => {
                // Update the templates
                this.micrositie = micrositie;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Set body
        this.setGrid([
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
        ]);

        // Load CSS
        const styleElement = document.createElement('style');
        styleElement.textContent = `.body {
            font-family: Arial, sans-serif; /* Example font stack */
            line-height: 1.6; /* Example line height */
            background-color: #f0f0f0; /* Example background color */
            color: #333; /* Example text color */
            margin: 0; /* Remove default margin */
            padding: 0; /* Remove default padding */
            height: 600px; /* height */
            width: 100%; /* width */
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
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Autosave
     * @param changes
     * @returns
     */
    saveChanges() {
        this.autosave.set(true);

        // Replace this with actual save logic, e.g., HTTP call to server
        // Simulated save request
        return new Promise((resolve) => {
            setTimeout(() => {
                this.autosave.set(false);
                resolve('Saved successfully');
            }, 5000);
        });
    }

    /**
     * Toggle fullscreem mode
     * @param mode
     */
    toggleFullscreen() {
        this.fullscreemToggle.emit(true);
    }

    /**
     * Set preview mode
     * @param mode
     */
    setPreview(mode: string) {
        this.preview = mode;
        this.previewMode = mode !== 'none' ? true : false;
    }

    /**
     * Ir atras
     *
     */
    goToBack() {
        if (this.micrositie) {
            this._router.navigateByUrl('/admin/modules/microsities/detail', {
                state: { id: this.micrositie.id },
            });
        } else {
            this._router.navigateByUrl('/admin/modules/pages');
        }
    }

    /**
     * Add section to grid
     */
    addSection() {
        const newSection = {
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
        };
        this.body.update((values) => {
            return [...values, newSection];
        });
    }

    /**
     * Set data to grid
     * @param grid
     */
    setGrid(grid: any) {
        this.body.set(grid);
    }

    /**
     * Open modal settings detail
     *
     * @param data
     * @param item
     */
    openSettingsModal<T>(data: T, item: string): void {
        this._modalSvc.openModal<GridSettingsComponent, T>(
            GridSettingsComponent,
            { title: item, ...data }
        );
    }
}
