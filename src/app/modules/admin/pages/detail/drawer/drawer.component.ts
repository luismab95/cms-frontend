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
import { ReactiveFormsModule } from '@angular/forms';
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
import { LanguagesComponent } from 'app/shared/components/languages/languages.component';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import { ReviewModeComponent } from 'app/shared/components/review-mode/review-mode.component';
import { PageElementsI, SectionI } from 'app/shared/interfaces/grid.interface';
import { LanguageService } from 'app/shared/services/language.service';
import { ModalService } from 'app/shared/services/modal.service';
import { validGrid } from 'app/shared/utils/grid.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
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
        ReactiveFormsModule,
        LanguagesComponent,
        PermissionComponent,
        ReviewModeComponent,
    ],
})
export class PagesDrawerComponent implements OnInit {
    @Output() fullscreemToggle: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    page: PageI;
    micrositie: MicrositieI;
    preview: string = 'none';
    previewMode: boolean = false;
    reviewChanges = signal<boolean>(false);
    body = signal<SectionI[]>([]);
    autosaveTimer: any;
    autosave = signal<boolean>(false);
    saveAction = signal<boolean>(false);
    urlStatics: string;
    refreshLanguage = signal<boolean>(false);
    languageId: number;
    permission = PermissionCode;

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
        private _languageService: LanguageService,
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
                this.urlStatics = findParameter(
                    'APP_STATICS_URL',
                    parameters
                ).value;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get languages
        this._languageService.languages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((languages) => {
                // Update the template
                this.languageId = languages.records[0].id;

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
                // Update the page
                this.page = page;
                if (this.page.lastChangeReject) {
                    this.reviewChanges.set(true);
                } else {
                    this.reviewChanges.set(false);
                }

                if (this.page.draft !== null) {
                    this.confirmDraft();
                } else {
                    this.loadPageData();
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
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
    /**
     * Set review data
     */
    setReviewData() {
        this.reviewChanges.set(false);
        this.loadPageData();
    }

    /**
     * Load template data from the server and update the component properties accordingly.
     */
    loadPageData() {
        this.refreshLanguage.set(true);
        this.loadGridData();
        this.loadStyles();

        // Mark for check
        this._changeDetectorRef.markForCheck();

        setTimeout(() => {
            this.refreshLanguage.set(false);
        }, 100);
    }

    /**
     * Update draft page
     */
    updateDraft() {
        if (this.page.review) {
            return;
        }

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
                    // Set the alert
                    this._toastrService.info(
                        'Guardando cambios en borrador',
                        'Aviso'
                    );
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
     *  Confirm update page
     */
    confirmUpdatePage() {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: `Editar página`,
            message: `¿Estas seguro/a que deseas editar la página? No podras volver a editar la página hasta que los cambios sean aprobados por un revisor.`,
            actions: {
                confirm: {
                    label: 'Editar',
                    color: 'primary',
                },
                cancel: {
                    label: 'Cancelar',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                this.updatePage();
            } else {
            }
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
        const key = this.reviewChanges() ? 'dataReview' : 'data';

        this._pageService
            .update(this.page.id, {
                name: this.page.name,
                data: {
                    body: {
                        data: this.body(),
                        css: this.page[key].body.css,
                        config: this.page[key].body.config,
                    },
                },
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
        // Set body
        const key = this.reviewChanges() ? 'dataReview' : 'data';
        this.setGrid(this.page[key].body.data);
    }

    /**
     * Load styles
     */
    loadStyles() {
        // Load CSS
        const key = this.reviewChanges() ? 'dataReview' : 'data';
        const styleElementToRemove =
            document.getElementById('body-dynamicStyles');
        if (styleElementToRemove) {
            styleElementToRemove.remove();
        }
        const styleElement = document.createElement('style');
        styleElement.id = 'body-dynamicStyles';
        styleElement.textContent = `${this.page[key].body.css}`;
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
     * Valid render permission
     */
    validPermission(code: string) {
        return validAction(code);
    }

    /**
     * Add section to grid
     */
    addSection() {
        const sectionUuid = generateRandomString(8);
        const rowUuid = generateRandomString(8);
        const columnUuid = generateRandomString(8);
        const newSection = {
            uuid: sectionUuid,
            css: `.grid-section-${sectionUuid}{}`,
            config: { backgroundImage: '' },
            rows: [
                {
                    uuid: rowUuid,
                    css: `.grid-row-${rowUuid}{}`,
                    config: { backgroundImage: '' },
                    columns: [
                        {
                            uuid: columnUuid,
                            css: `.grid-column-${columnUuid}{}`,
                            config: { backgroundImage: '' },
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
    openSettingsModal(item: string): void {
        const key = this.reviewChanges() ? 'dataReview' : 'data';
        const dialogRef = this._modalSvc.openModal<
            GridSettingsComponent,
            PageElementsI
        >(GridSettingsComponent, { title: item, ...this.page[key].body });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.page[key].body.css = result.css;
                this.page[key].body.config = result.config;
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
        const key = this.reviewChanges() ? 'dataReview' : 'data';
        let styles = {};
        if (this.page[key].body.config.backgroundImage !== '') {
            styles = {
                'background-image': `url('${this.urlStatics}/${this.page[key].body.config.backgroundImage}')`,
            };
        }
        return styles;
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

    /**
     * Set language
     * @param id
     */
    setLanguageId(id: number) {
        this.languageId = id;
        this.refreshLanguage.set(true);

        // Mark for check
        this._changeDetectorRef.markForCheck();

        setTimeout(() => {
            this.refreshLanguage.set(false);
        }, 100);
    }
}
