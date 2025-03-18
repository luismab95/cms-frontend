import { NgClass, NgStyle } from '@angular/common';
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
import { Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MicrosityService } from 'app/modules/admin/microsities/micrositie.service';
import { MicrositieI } from 'app/modules/admin/microsities/micrositie.types';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { GridComponent } from 'app/shared/components/grid/grid.component';
import { GridSettingsComponent } from 'app/shared/components/grid/settings/settings.component';
import { PageElementsI, SectionI } from 'app/shared/interfaces/grid.interface';
import { ModalService } from 'app/shared/services/modal.service';
import { validGrid } from 'app/shared/utils/grid.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { generateRandomString } from 'app/shared/utils/random.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { PageService } from '../../pages.service';
import { PageI } from '../../pages.types';
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
        MatTooltipModule,
        GridComponent,
        MatMenuModule,
        NgStyle,
    ],
})
export class PagesDrawerComponent implements OnInit {
    @Output() fullscreemToggle: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    page: PageI;
    micrositie: MicrositieI;
    preview: string = 'none';
    previewMode: boolean = false;
    body = signal<SectionI[]>([]);
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
        private _router: Router,
        private _modalSvc: ModalService,
        private _microsityService: MicrosityService,
        private _pageService: PageService,
        private _toastrService: ToastrService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        // autosave logic
        this.autosaveTimer = setInterval(() => {
            this.updateDraft();
        }, 300000);

        // Get micrositie
        this._microsityService.micrositie$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((micrositie) => {
                // Update the templates
                this.micrositie = micrositie;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get parameters
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
        // Get page
        this._pageService.page$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((page) => {
                if (page) {
                    // Update the page
                    this.page = page;

                    if (this.page.draft !== null) {
                        this.confirmDraft();
                    } else {
                        this.loadPageData();
                    }
                }
            });
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
     * Load template data from the server and update the component properties accordingly.
     */
    loadPageData() {
        this.loadGridData();
        this.loadStyles();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Update draft page
     */
    updateDraft() {
        // Disable the save action
        this.saveAction.set(true);
        this.autosave.set(true);

        //Set data page elements
        this.page.data.body.data = this.body();

        this._pageService
            .saveDraft(this.page.id, {
                name: this.page.name,
                data: this.page.data,
            })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the save action
                    this.saveAction.set(false);
                    this.autosave.set(false);
                },
                error: (response) => {
                    // Re-enable the save action
                    this.saveAction.set(false);
                    this.autosave.set(false);

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Update page
     */
    updatePage() {
        // Return if the grid is invalid
        if (!validGrid(this.body())) {
            this._toastrService.warning(
                'Termina de configurar el contenido de la página.',
                'Aviso'
            );
            return;
        }

        // Disable the save action
        this.saveAction.set(true);

        //Set data page elements
        this.page.data.body.data = this.body();

        this._pageService
            .update(this.page.id, {
                name: this.page.name,
                data: this.page.data,
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
        this.setGrid(this.page.data.body.data);
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
        styleElement.textContent = `${this.page.data.body.css}`;
        document.head.appendChild(styleElement);
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
            css: '',
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
        } as SectionI;
        this.body.update((values) => {
            return [...values, newSection];
        });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Set data to grid
     * @param grid
     */
    setGrid(grid: SectionI[]) {
        this.body.set(grid);
    }

    /**
     * Open modal settings detail
     *
     * @param data
     * @param item
     */
    openSettingsModal(data: PageElementsI, item: string): void {
        const dialogRef = this._modalSvc.openModal<
            GridSettingsComponent,
            PageElementsI
        >(GridSettingsComponent, { title: item, ...data });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.page.data.body.css = result.css;
                this.page.data.body.config = result.config;
                this.loadStyles();
                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    /**
     * Get config styles
     * @returns
     */
    getStyles() {
        let styles = {};
        if (this.page.data.body.config.backgroundImage !== '') {
            styles = {
                'background-image': `url('${this.urlStatics}/${this.page.data.body.config.backgroundImage}')`,
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

    /**
     *  Choose load data draft
     */
    confirmDraft() {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: `Cambios sin guardar`,
            message: `Tienes cambios sin guardar en borrador, ¿Deseas seguir editando?.`,
            actions: {
                confirm: {
                    label: 'Editar',
                    color: 'primary',
                },
                cancel: {
                    label: 'Descartar',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                this.page.data = this.page.draft;
            } else {
                this.deleteDraft();
            }
            this.loadPageData();
        });
    }

    /**
     * Delete template draft
     */
    deleteDraft() {
        // Disable the save action
        this.saveAction.set(true);

        this._pageService
            .deleteDraft(this.page.id)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the save action
                    this.saveAction.set(false);
                },
                error: (response) => {
                    // Re-enable the save action
                    this.saveAction.set(false);

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }
}
