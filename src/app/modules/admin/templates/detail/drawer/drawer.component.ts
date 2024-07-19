import { CommonModule, NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
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
import { RouterLink } from '@angular/router';
import { GridComponent } from 'app/shared/components/grid/grid.component';
import { GridSettingsComponent } from 'app/shared/components/grid/settings/settings.component';
import { ModalService } from 'app/shared/services/modal.service';
import { generateRandomString } from 'app/shared/utils/random.utils';
import { Subject } from 'rxjs';

@Component({
    selector: 'templates-drawer',
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
        CommonModule,
    ],
})
export class TemplatesDrawerComponent implements OnInit {
    @Input() template: any;
    @Output() fullscreemToggle: EventEmitter<boolean> =
        new EventEmitter<boolean>();
    preview: string = 'none';
    previewMode: boolean = false;
    header = signal<any>([]);
    footer = signal<any>([]);
    autosaveTimer: any;
    autosave = signal<boolean>(false);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(private _modalSvc: ModalService) {
        // Example autosave logic
        this.autosaveTimer = setInterval(() => {
            this.saveChanges();
        }, 10000);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

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

        // Load CSS
        const styleElement = document.createElement('style');
        styleElement.textContent = `.header {
    background-color: #333; /* Background color */
    color: #fff; /* Text color */
    padding: 20px 0; /* Padding around content */
    text-align: center; /* Center align text */
}
    .footer {
    background-color: #333; /* Background color */
    color: #fff; /* Text color */
    padding: 20px 0; /* Padding around content */
    text-align: center; /* Center align text */
    width: 100%; /* Full width */
}`;
        document.head.appendChild(styleElement);

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
     * Add section to grid
     * @param item header | footer
     */
    addSection(item: 'header' | 'footer') {
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
        if (item === 'header')
            this.header.update((values) => {
                return [...values, newSection];
            });
        if (item === 'footer')
            this.footer.update((values) => {
                return [...values, newSection];
            });
    }

    /**
     * Set data to grid
     * @param grid
     * @param item
     */
    setGrid(grid: any, item: 'header' | 'footer') {
        if (item === 'header') this.header.set(grid);
        if (item === 'footer') this.footer.set(grid);
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
