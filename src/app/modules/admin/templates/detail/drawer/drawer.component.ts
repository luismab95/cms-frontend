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
import { RouterLink } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { GridComponent } from 'app/shared/components/grid/grid.component';
import { GridSettingsComponent } from 'app/shared/components/grid/settings/settings.component';
import { LanguagesComponent } from 'app/shared/components/languages/languages.component';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import { PageElementsI, SectionI } from 'app/shared/interfaces/grid.interface';
import { LanguageService } from 'app/shared/services/language.service';
import { ModalService } from 'app/shared/services/modal.service';
import { validGrid } from 'app/shared/utils/grid.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
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
        NgStyle,
        LanguagesComponent,
        PermissionComponent,
    ],
})
export class TemplatesDrawerComponent implements OnInit {
    @Output() fullscreemToggle: EventEmitter<boolean> =
        new EventEmitter<boolean>();

    template: TemplateI;
    preview: string = 'none';
    previewMode: boolean = false;
    header = signal<SectionI[]>([]);
    footer = signal<SectionI[]>([]);
    autosaveTimer: any;
    autosave = signal<boolean>(false);
    saveAction = signal<boolean>(false);
    refreshLanguage = signal<boolean>(false);
    urlStatics: string;
    languageId: number;
    permission = PermissionCode;

    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _modalSvc: ModalService,
        private _templateService: TemplateService,
        private _toastrService: ToastrService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _languageService: LanguageService
    ) {
        // autosave logic
        this.autosaveTimer = setInterval(() => {
            this.updateDraft();
        }, 300000);

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
        this._templateService.template$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((template) => {
                if (template) {
                    // Update the template
                    this.template = template;

                    if (this.template.draft !== null) {
                        this.confirmDraft();
                    } else {
                        this.loadTemplateData();
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
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Load template data from the server and update the component properties accordingly.
     */
    loadTemplateData() {
        this.loadGridData();
        this.loadStyles();

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Update template
     */
    updateDraft() {
        // Disable the save action
        this.saveAction.set(true);
        this.autosave.set(true);

        //Set data page elements
        this.template.data.header.data = this.header();
        this.template.data.footer.data = this.footer();

        this._templateService
            .saveDraft(this.template.id, {
                name: this.template.name,
                description: this.template.description,
                data: this.template.data,
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

        //Set data page elements
        this.template.data.header.data = this.header();
        this.template.data.footer.data = this.footer();

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
        const styleElementToRemove = document.getElementById(
            'template-dynamicStyles'
        );
        if (styleElementToRemove) {
            styleElementToRemove.remove();
        }
        const styleElement = document.createElement('style');
        styleElement.id = 'template-dynamicStyles';
        styleElement.textContent = `${this.template.data.header.css} ${this.template.data.footer.css}`;
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
     * Add section to grid
     * @param item header | footer
     */
    addSection(item: 'header' | 'footer') {
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
        if (item === 'header')
            this.header.update((values) => {
                return [...values, newSection];
            });
        if (item === 'footer')
            this.footer.update((values) => {
                return [...values, newSection];
            });

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Set data to grid
     * @param grid
     * @param item
     */
    setGrid(grid: SectionI[], item: 'header' | 'footer') {
        if (item === 'header') this.header.set(grid);
        if (item === 'footer') this.footer.set(grid);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Open modal settings detail
     *
     * @param data
     * @param item
     */
    openSettingsModal(data: PageElementsI, item: string, code: string): void {
        const dialogRef = this._modalSvc.openModal<
            GridSettingsComponent,
            PageElementsI
        >(GridSettingsComponent, { title: item, ...data });

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
                this.template.data = this.template.draft;
            } else {
                this.deleteDraft();
            }
            this.loadTemplateData();
        });
    }

    /**
     * Delete template draft
     */
    deleteDraft() {
        // Disable the save action
        this.saveAction.set(true);

        this._templateService
            .deleteDraft(this.template.id)
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

    /**
     * Valid render permission
     */
    validPermission(code: string) {
        return validAction(code);
    }
}
