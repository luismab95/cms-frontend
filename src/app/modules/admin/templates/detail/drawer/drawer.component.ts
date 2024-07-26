import { CommonModule, NgClass, NgStyle } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    OnInit,
    Output,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { GridComponent } from 'app/shared/components/grid/grid.component';
import { GridSettingsComponent } from 'app/shared/components/grid/settings/settings.component';
import { ModalService } from 'app/shared/services/modal.service';
import { validGrid } from 'app/shared/utils/grid.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { generateRandomString } from 'app/shared/utils/random.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { TemplateService } from '../../templates.service';
import { TemplateI } from '../../templates.types';

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
        NgStyle,
    ],
})
export class TemplatesDrawerComponent implements OnInit {
    @Output() fullscreemToggle: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    template: TemplateI;
    preview: string = 'none';
    previewMode: boolean = false;
    header = signal<any>([]);
    footer = signal<any>([]);
    autosaveTimer: any;
    autosave = signal<boolean>(false);
    saveAction = signal<boolean>(false);
    urlStatics: string;

    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _modalSvc: ModalService,
        private _templateService: TemplateService,
        private _toastrService: ToastrService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        // autosave logic
        this.autosaveTimer = setInterval(() => {
            this.saveChanges();
        }, 10000);

        this._parameterService.parameter$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((parameters: ParameterI[]) => {
                this.urlStatics = this.getParameter(
                    'APP_STATICS_URL',
                    parameters
                );
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
        this._templateService.template$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((template) => {
                // Update the template
                this.template = template;

                if (template) {
                    this.loadGridData();
                    this.loadStyles();
                }
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
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
     * Update template
     */
    updateTemplate() {
        // Return if the grid is invalid
        if (!validGrid(this.header())) {
            this._toastrService.warning(
                'Termina de configurar tu encabezado de página.',
                'Aviso'
            );
            return;
        }

        if (!validGrid(this.footer())) {
            this._toastrService.warning(
                'Termina de configurar tu pie de página.',
                'Aviso'
            );
            return;
        }

        // Disable the save action
        this.saveAction.set(true);

        this._templateService
            .update(this.template.id, {
                name: this.template.name,
                description: this.template.description,
                data: this.template.data,
            })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the save action
                    this.saveAction.set(false);
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );
                },
                error: (response) => {
                    // Re-enable the save action
                    this.saveAction.set(false);

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Load data
     */
    loadGridData() {
        // Set header
        this.setGrid(this.template.data.header.data, 'header');

        // Set footer
        this.setGrid(this.template.data.footer.data, 'footer');
    }

    /**
     * Load styles
     */
    loadStyles() {
        // Load CSS
        const styleElementToRemove = document.getElementById('dynamicStyles');
        if (styleElementToRemove) {
            styleElementToRemove.remove();
        }
        const styleElement = document.createElement('style');
        styleElement.id = 'dynamicStyles';
        styleElement.textContent = `${this.template.data.header.css} ${this.template.data.footer.css}`;
        document.head.appendChild(styleElement);
    }

    /**
     * Autosave
     * @param changes
     * @returns
     */
    saveChanges() {
        this.autosave.set(true);
        // Replace this with actual save logic, e.g., HTTP call to server
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
    openSettingsModal<T>(data: T, item: string, code: string): void {
        const dialogRef = this._modalSvc.openModal<GridSettingsComponent, T>(
            GridSettingsComponent,
            { title: item, ...data }
        );

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.template.data[code].css = result.css;
                this.template.data[code].config = result.config;
                this.loadStyles();
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Get config styles
     * @param code
     * @returns
     */
    getStyles(code: string) {
        let styles = {};
        if (this.template.data[code].config.backgroundImage !== '') {
            styles = {
                'background-image': `url('${this.urlStatics}/${this.template.data[code].config.backgroundImage}')`,
            };
        }
        return styles;
    }

    /**
     * Get parameter
     * @param code
     */
    getParameter(code: string, parameters: ParameterI[]) {
        if (parameters.length > 0) {
            return findParameter(code, parameters).value;
        }
    }
}
