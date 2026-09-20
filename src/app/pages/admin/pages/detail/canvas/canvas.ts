import { Component, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgStyle, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { NgLabelTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { PageI, PreviewModeT } from 'app/core/interfaces/page.interface';
import { DialogService } from 'app/core/services/dialog.service';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { PageService } from 'app/core/services/pages.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { ColumnI, SectionI, SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';
import { LanguageService } from 'app/shared/services/language.service';
import {
  findColumnByUuid,
  findElementByUuid,
  findRowByUuid,
  findSectionByUuid,
  updateColumn,
  validGrid,
} from 'app/shared/utils/grid.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { generateRandomString } from 'app/shared/utils/random.utils';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { ReviewModeComponent } from 'app/shared/components/review-mode/review-mode';
import { GridComponent } from 'app/shared/components/grid/grid';
import { LayerComponent } from 'app/shared/components/layer/layer';
import { InspectorComponent } from 'app/shared/components/inspector/inspector';
import { LanguageI } from 'app/shared/interfaces/language.interfaces';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'pages-canvas',
  templateUrl: './canvas.html',
  styles: [
    `
      ::ng-deep .ng-select-container {
        border: unset !important;
      }

      ::ng-deep .ng-arrow-wrapper {
        display: none !important;
      }
      .bg-dot-grid {
        background-size: 24px 24px;
        background-image: radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px);
      }
    `,
  ],
  imports: [
    FormsModule,
    PermissionComponent,
    NgStyle,
    NgClass,
    UpperCasePipe,
    NgSelectComponent,
    NgLabelTemplateDirective,
    ReviewModeComponent,
    GridComponent,
    LayerComponent,
    InspectorComponent,
    TooltipDirective,
  ],
})
export class PagesCanvas implements OnInit {
  @ViewChild('languageSelect')
  private readonly _languageSelect!: NgSelectComponent;

  @ViewChild('layer')
  private readonly _layer!: LayerComponent;

  preview = signal<PreviewModeT>('desktop');
  previewMode = signal<boolean>(false);
  openElementPanel = signal<boolean>(false);
  reviewChanges = signal<boolean>(false);
  autosave = signal<boolean>(false);
  saveAction = signal<boolean>(false);
  urlStatics = signal<string>('');
  languageId = signal<number>(0);
  page = signal<PageI | null>(null);
  originPage = signal<PageI | null>(null);
  height = signal<number>(window.innerHeight);
  activeLanguages = signal<LanguageI[]>([]);
  currentColumn = signal<ColumnI | null>(null);
  autosaveTimer: number | undefined;
  permission = PermissionCode;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _router = inject(Router);
  private _parameterService = inject(ParameterService);
  private _dialogService = inject(DialogService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _pageService = inject(PageService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _languageService = inject(LanguageService);
  private readonly _historyService = inject(HistoryService);

  readonly bodySections = this._pageService.sections;

  readonly _page = toSignal(this._pageService.page$, { initialValue: null });
  readonly _selectedItemsInGrid = toSignal(this._pageService.selectedItemsInGrid$, {
    initialValue: null,
  });
  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });
  readonly micrositie = toSignal(this._microsityService.micrositie$, { initialValue: null });
  readonly languages = toSignal(this._languageService.languages$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  readonly canRedo = computed(() => this._historyService.canRedo());
  readonly canUndo = computed(() => this._historyService.canUndo());
  readonly body = computed(() => this.bodySections());

  /**
   * Constructor
   */
  constructor() {
    // autosave logic
    this.autosaveTimer = setInterval(() => {
      this.updateDraft();
    }, 300_000);

    effect(() => {
      const languages = this.languages().records.filter((lang) => lang.status);
      if (languages.length > 0) this.languageId.set(languages[0].id!);
      this.activeLanguages.set(languages);
    });

    effect(() => {
      const languages = this.languages().records.filter((lang) => lang.status);
      if (languages.length > 0) this.languageId.set(languages[0].id!);
      this.activeLanguages.set(languages);
    });

    effect(() => {
      const parameters = this.parameters();
      if (parameters.length > 0)
        this.urlStatics.set(findParameter('APP_STATICS_URL', parameters)!.value);
    });

    effect(() => {
      const page = this._page();
      if (page === null) return;

      this.page.set(page);
      this.originPage.set(page);

      if (page.lastChangeReject) {
        this.reviewChanges.set(true);
      } else {
        this.reviewChanges.set(false);
      }

      if (page.review) this.previewMode.set(true);

      if (page.draft !== null) {
        this.confirmDraft();
      } else {
        this.loadPageData();
      }
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {}

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
    }
    this._pageService.selectedItemsInGrid = {
      section: null,
      column: null,
      row: null,
      element: null,
    };
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
    this.loadGridData();
    this.loadStyles();
  }

  /**
   * Update draft page
   */
  updateDraft() {
    if (
      !this.validPermission(this.permission.editContentPage) &&
      !this.validPermission(this.permission.editDesignPage)
    )
      return;

    if (this.page()!.review) {
      return;
    }

    // Disable the save action
    this.saveAction.set(true);
    this.autosave.set(true);

    const page = this.page();
    if (page == null) return;

    //Set data page elements
    page.data!.body.data = this.body();

    this._pageService
      .saveDraft(page.id!, {
        name: page.name,
        data: page.data,
      })
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
          this.autosave.set(false);
          this._toastrService.success(
            'Tus cambios se guardaron automáticamente como borrador.',
            'Borrador actualizado',
          );
        },
        error: (response) => {
          this.saveAction.set(false);
          this.autosave.set(false);
          this._toastrService.error(
            response.error?.message || 'No fue posible guardar cambios borrador de la página.',
            'Error al guardar',
          );
        },
      });
  }

  /**
   *  Confirm update page
   */
  confirmUpdatePage() {
    // Open the confirmation dialog
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Editar página`,
      message: `¿Estas seguro/a que deseas editar la página? No podras volver a editar la página hasta que los cambios sean aprobados por un revisor.`,
      confirmButton: 'Si, Enviar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();

    // Subscribe to the confirmation dialog closed action
    this._dialogService.actionClick$.pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
      if (result) {
        this.updatePage();
      }
    });
  }

  /**
   * Update page
   */
  updatePage() {
    // Return if the grid is invalid
    if (!validGrid(this.body())) {
      this._toastrService.warning('Termina de configurar el contenido de la página.', 'Aviso');
      return;
    }

    // Disable the save action
    this.saveAction.set(true);

    const page = this.page();
    if (page == null) return;

    const pageData = this.reviewChanges() ? page.dataReview : page.data;

    this._pageService
      .update(page.id!, {
        name: page.name,
        data: {
          body: {
            data: this.body(),
            css: pageData!.body.css,
            config: pageData!.body.config,
          },
        },
      })
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
          this._toastrService.success(
            'El diseño de la página se actualizó correctamente.',
            'Cambios guardados',
          );
        },
        error: (response) => {
          this.saveAction.set(false);
          this._toastrService.error(response.error.message, 'Aviso');
          this._toastrService.error(
            response.error?.message || 'No fue posible guardar los cambios de diseño de la página.',
            'Error al guardar',
          );
        },
      });
  }

  /**
   * Load data
   */
  loadGridData() {
    // Set body
    const pageData = this.reviewChanges() ? this.page()!.dataReview : this.page()!.data;
    this.setGrid(pageData!.body.data);
  }

  /**
   * Load styles
   */
  loadStyles() {
    // Load CSS
    const pageData = this.reviewChanges() ? this.page()!.dataReview : this.page()!.data;

    const styleElementToRemove = document.getElementById('body-dynamicStyles');
    if (styleElementToRemove) {
      styleElementToRemove.remove();
    }
    const styleElement = document.createElement('style');
    styleElement.id = 'body-dynamicStyles';
    styleElement.textContent = `${pageData!.body.css}`;
    document.head.appendChild(styleElement);
  }

  /**
   * Set preview mode
   * @param mode
   */
  setPreviewMode(mode: PreviewModeT) {
    this.preview.set(mode);
  }

  /**
   * Toggle preview mode
   */
  togglePreviewMode() {
    this.previewMode.update((preview) => !preview);

    if (!this.previewMode()) {
      this._layer.closeLayers();
    } else {
      this._layer.openLayers();
    }

    clearInterval(this.autosaveTimer);

    if (!this.previewMode()) {
      this.autosaveTimer = setInterval(() => {
        this.updateDraft();
      }, 300_000);
    }
  }

  /**
   * Ir atras
   *
   */
  goToBack() {
    this._router.navigateByUrl('/admin/content/pages/detail', {
      state: {
        id: this.page() === null ? 0 : this.page()!.id,
        micrositieId: this.micrositie() !== null ? this.micrositie()!.id : 0,
      },
    });
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
    } as unknown as SectionI;

    const previous = structuredClone(this.body());
    const next = structuredClone([...this.body(), newSection]);
    this._pageService.sections = next;
    this._historyService.commit(previous, next);
  }

  /**
   * Set data to grid
   * @param grid
   */
  setGrid(grid: SectionI[]) {
    this._pageService.sections = grid;
  }

  /**
   * Get config styles
   * @returns
   */
  getStyles() {
    const pageData = this.reviewChanges() ? this.page()!.dataReview : this.page()!.data;
    let styles = {};
    if (pageData!.body.config['backgroundImage'] !== '') {
      styles = {
        'background-image': `url('${this.urlStatics}/${pageData!.body.config['backgroundImage']}')`,
      };
    }
    return styles;
  }

  /**
   *  Choose load data draft
   */
  confirmDraft() {
    // Open the confirmation dialog
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Cambios sin guardar`,
      message: `Tienes cambios sin guardar en borrador, ¿Deseas seguir editando?.`,
      confirmButton: 'Si, Editar',
      cancelButton: 'Descartar cambios',
    });

    this._dialogService.toggleDialog();

    // Subscribe to the confirmation dialog closed action
    this._dialogService.actionClick$.pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
      if (result) {
        const page = this.page();
        page!.data = page!.draft;
        this.page.set(page);
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

    const page = this.page();
    if (page == null) return;

    this._pageService
      .deleteDraft(page.id!)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
        },
        error: (response) => {
          this.saveAction.set(false);
          this._toastrService.error(
            response.error?.message ||
              'No fue posible descartar los cambios de diseño de la página.',
            'Error al descartar',
          );
        },
      });
  }

  /**
   * Set language
   * @param id
   */
  setLanguageId(id: number) {
    this.languageId.set(id);
  }

  /**
   * OPen language select
   */
  openLanguageSelect() {
    this._languageSelect.open();
  }

  /**
   * revert changes
   */
  cancel() {
    // Open the confirmation dialog
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Descartar cambios`,
      message: `¿Estas seguro/a que deseas descartar estos cambos?. Esta acción no se puede deshacer.`,
      confirmButton: 'Si, Descartar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();

    // Subscribe to the confirmation dialog closed action
    this._dialogService.actionClick$.pipe(takeUntil(this._unsubscribeAll)).subscribe((result) => {
      if (result) {
        const page = this.originPage();
        this.page.set(page);
        this.deleteDraft();
        this.loadPageData();
        this.updateSelectionItem({
          section: null,
          row: null,
          column: null,
          element: null,
        });
        this._historyService.clear();
      }
    });
  }

  /**
   * Selected items
   * @param selectedItemsInGrid
   */
  updateSelectionItem(selectedItemsInGrid: SelectedItemsInGridI) {
    this._pageService.selectedItemsInGrid = selectedItemsInGrid;
  }

  /**
   * toggle element panel
   */
  toggleElementPanel(column: ColumnI) {
    this.currentColumn.set(column);
    this.openElementPanel.set(true);
  }

  /**
   * set element
   */
  setElementSelectedInColumn(element: ElementCMSI | null) {
    this.openElementPanel.set(false);
    const column = this.currentColumn();
    if (element === null) {
      this.currentColumn.set(null);
      return;
    }

    if (column === null) return;

    const previous = structuredClone(this.body());
    const elementUuid = generateRandomString(8);
    column.element = {
      uuid: elementUuid,
      name: element.name,
      css: `.${element.css}-${elementUuid}{}`,
      config: element.config,
      text: element.text,
      dataText: [],
    };

    const sectionsUpdate = updateColumn(this.body(), column.uuid, column);

    const next = structuredClone(sectionsUpdate);
    this._pageService.sections = next;
    this._historyService.commit(previous, next);
    this._pageService.selectedItemsInGrid = {
      section: null,
      column: null,
      row: null,
      element: column.element,
    };
  }

  /**
   * Undo Changes
   */
  undo() {
    const state = this._historyService.undo();
    if (state) {
      this._pageService.sections = state;
      this.refreshSelectedItemsInGrid(state);
    }
  }

  /**
   * Redo changes
   */
  redo() {
    const state = this._historyService.redo();
    if (state) {
      this._pageService.sections = state;
      this.refreshSelectedItemsInGrid(state);
    }
  }

  /**
   * Refresh selections
   */
  refreshSelectedItemsInGrid(state: SectionI[]) {
    const selectedItemsInGrid = this._selectedItemsInGrid();

    if (selectedItemsInGrid === null) return;
    this._pageService.selectedItemsInGrid = {
      section: findSectionByUuid(state, selectedItemsInGrid?.section?.uuid ?? ''),
      row: findRowByUuid(state, selectedItemsInGrid?.row?.uuid ?? ''),
      column: findColumnByUuid(state, selectedItemsInGrid?.column?.uuid ?? ''),
      element: findElementByUuid(state, selectedItemsInGrid?.element?.uuid ?? ''),
    };
  }
}
