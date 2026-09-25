import { Component, OnInit, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass, NgStyle, UpperCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { NgLabelTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { CanvasT, PreviewModeT } from 'app/core/interfaces/page.interface';
import { DialogService } from 'app/core/services/dialog.service';
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
import { GridComponent } from 'app/shared/components/grid/grid';
import { LayerComponent } from 'app/shared/components/layer/layer';
import { InspectorComponent } from 'app/shared/components/inspector/inspector';
import { LanguageI } from 'app/shared/interfaces/language.interfaces';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { DeviceDetectorService, DeviceType } from 'ngx-device-detector';
import { TemplateService } from 'app/core/services/templates.service';
import { TemplateI } from 'app/core/interfaces/template.interface';
import { EMPTY, interval, startWith, Subject, switchMap, takeUntil } from 'rxjs';

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
    GridComponent,
    LayerComponent,
    InspectorComponent,
    TooltipDirective,
  ],
})
export class TemplatesCanvas implements OnInit {
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
  template = signal<TemplateI | null>(null);
  originTemplate = signal<TemplateI | null>(null);
  height = signal<number>(window.innerHeight);
  activeLanguages = signal<LanguageI[]>([]);
  currentColumn = signal<ColumnI | null>(null);
  permission = PermissionCode;

  private destroy$ = new Subject<void>();
  private autosaveToggle$ = new Subject<void>();

  private readonly _router = inject(Router);
  private _parameterService = inject(ParameterService);
  private _dialogService = inject(DialogService);
  private readonly _pageService = inject(PageService);
  private readonly _templateService = inject(TemplateService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _languageService = inject(LanguageService);
  private readonly _historyService = inject(HistoryService);
  private readonly _deviceDetectorService = inject(DeviceDetectorService);

  readonly headerSections = this._pageService.sectionsHeader;
  readonly footerSections = this._pageService.sectionsFooter;

  readonly _template = toSignal(this._templateService.template$, { initialValue: null });
  readonly _selectedItemsInGrid = toSignal(this._pageService.selectedItemsInGrid$, {
    initialValue: null,
  });
  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });
  readonly languages = toSignal(this._languageService.languages$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  readonly canRedo = computed(() =>
    this._historyService.canRedo![this._selectedItemsInGrid()?.canvas ?? 'header'](),
  );
  readonly canUndo = computed(() =>
    this._historyService.canUndo![this._selectedItemsInGrid()?.canvas ?? 'header'](),
  );
  readonly header = computed(() => this.headerSections());
  readonly footer = computed(() => this.footerSections());

  readonly previewType = computed(() => {
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

  sectionsByType = {
    header: {
      get: () => this.headerSections(),
      set: (sections: SectionI[]) => {
        this._pageService.sectionsHeader = sections;
      },
    },
    footer: {
      get: () => this.footerSections(),
      set: (sections: SectionI[]) => {
        this._pageService.sectionsFooter = sections;
      },
    },
  } satisfies Record<
    Exclude<CanvasT, 'body'>,
    {
      get: () => SectionI[];
      set: (sections: SectionI[]) => void;
    }
  >;

  /**
   * Constructor
   */
  constructor() {
    this._pageService.sections = [];
    // autosave logic
    this.autosaveToggle$
      .pipe(
        startWith(null),
        switchMap(() => (this.previewMode() ? EMPTY : interval(300_000))),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.updateDraft());

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
      const template = this._template();
      if (template === null) return;

      this.template.set(template);
      this.originTemplate.set(template);

      if (template.draft !== null) {
        this.confirmDraft();
      } else {
        this.loadTemplateData();
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
    this.destroy$.next();
    this.destroy$.complete();
    this.autosaveToggle$.complete();
    this._pageService.selectedItemsInGrid = {
      page: null,
      section: null,
      column: null,
      row: null,
      element: null,
      canvas: 'body',
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
    this.loadTemplateData();
  }

  /**
   * Load template data from the server and update the component properties accordingly.
   */
  loadTemplateData() {
    this.loadGridData();
    this.loadStyles();
  }

  /**
   * Update draft page
   */
  updateDraft() {
    if (this.previewType() !== 'desktop') return;

    if (
      !this.validPermission(this.permission.editContentPage) &&
      !this.validPermission(this.permission.editDesignPage)
    )
      return;

    // Disable the save action
    this.saveAction.set(true);
    this.autosave.set(true);

    const template = this.template();
    if (template === null) return;

    //Set data template elements
    template.data!.header!.data = this.header();
    template.data!.footer!.data = this.footer();

    this._templateService
      .saveDraft(template.id!, {
        name: template.name,
        description: template.description,
        data: template.data,
      })
      .pipe(takeUntil(this.destroy$))
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
            response.error?.message || 'No fue posible guardar cambios borrador de la plantilla.',
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
      title: `Editar plantilla`,
      message: `¿Estas seguro/a que deseas editar la plantilla? esta acción no se puede deshacer.`,
      confirmButton: 'Si, Editar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();

    // Subscribe to the confirmation dialog closed action
    this._dialogService.actionClick$.pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        this.updateTemplate();
      }
    });
  }

  /**
   * Update page
   */
  updateTemplate() {
    // Return if the grid is invalid
    if (!validGrid(this.header())) {
      this._toastrService.warning('Termina de configurar el contenido de tu encabezado.', 'Aviso');
      return;
    }

    if (!validGrid(this.footer())) {
      this._toastrService.warning(
        'Termina de configurar el contenido de tu pie de página.',
        'Aviso',
      );
      return;
    }

    // Disable the save action
    this.saveAction.set(true);

    const template = this.template();
    if (template == null) return;

    template.data!.header.data = this.header();
    template.data!.footer.data = this.footer();

    this._templateService
      .update(template.id!, {
        name: template.name,
        description: template.description,
        data: template.data,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
          this._toastrService.success(
            'El diseño de la plantilla se actualizó correctamente.',
            'Cambios guardados',
          );
        },
        error: (response) => {
          this.saveAction.set(false);
          this._toastrService.error(response.error.message, 'Aviso');
          this._toastrService.error(
            response.error?.message ||
              'No fue posible guardar los cambios de diseño de la plantilla.',
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
    const templateData = this.template()!.data;
    this.setGrid(templateData!.header.data, 'header');
    this.setGrid(templateData!.footer.data, 'footer');
  }

  /**
   * Load styles
   */
  loadStyles() {
    // Load CSS
    const templateData = this.template()!.data;

    const styleElementToRemove = document.getElementById('template-dynamicStyles');
    if (styleElementToRemove) {
      styleElementToRemove.remove();
    }
    const styleElement = document.createElement('style');
    styleElement.id = 'template-dynamicStyles';
    styleElement.textContent = `${templateData!.header.css} ${templateData!.footer.css}`;
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
    const isPreview = this.previewMode();
    if (isPreview) {
      this.updateDraft(); // opcional: guarda antes de entrar a preview
      this._layer.openLayers();
    } else {
      this._layer.closeLayers();
    }
    this.autosaveToggle$.next();
  }

  /**
   * Ir atras
   *
   */
  goToBack() {
    this._router.navigateByUrl('/admin/content/templates/detail', {
      state: {
        id: this.template() === null ? 0 : this.template()!.id,
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
   *  Add section to grid
   *  @param item
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
    } as unknown as SectionI;

    const sections = this.sectionsByType[item].get();
    const previous = structuredClone(sections);
    const next = structuredClone([...sections, newSection]);
    this.sectionsByType[item].set(next);
    this._historyService.commit(item, previous, next);

    this.updateSelectionItem({
      page: null,
      section: newSection,
      row: null,
      column: null,
      element: null,
      canvas: item,
    });
  }

  /**
   * Set data to grid
   * @param grid Set data to grid
   * @param item
   */
  setGrid(grid: SectionI[], item: Exclude<CanvasT, 'body'>) {
    this.sectionsByType[item].set(grid);
  }

  /**
   * Get config styles
   * @param code
   * @returns
   */
  getStyles(code: string) {
    const templateData = this.template()!.data!;
    let styles = {};
    const template = templateData[code as keyof typeof templateData];
    if (template?.config['backgroundImage'] !== '') {
      styles = {
        'background-image': `url('${this.urlStatics}/${template!.config['backgroundImage']}')`,
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
    this._dialogService.actionClick$.pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        const template = this.template()!;
        template.data = template!.draft!;
        this.template.set(template);
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

    const template = this.template();
    if (template == null) return;

    this._templateService
      .deleteDraft(template.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
        },
        error: (response) => {
          this.saveAction.set(false);
          this._toastrService.error(
            response.error?.message ||
              'No fue posible descartar los cambios de diseño de la plantilla.',
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
    this._dialogService.actionClick$.pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result) {
        const template = this.originTemplate();
        this.template.set(template);
        this.deleteDraft();
        this.loadTemplateData();
        this.updateSelectionItem({
          page: null,
          section: null,
          row: null,
          column: null,
          element: null,
          canvas: 'header',
        });
        this._historyService.clearAll();
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
   * @param element
   * @param item
   */
  setElementSelectedInColumn(element: ElementCMSI | null) {
    this.openElementPanel.set(false);
    const column = this.currentColumn();
    if (element === null) {
      this.currentColumn.set(null);
      return;
    }

    if (column === null) return;

    const item = this._selectedItemsInGrid()!.canvas! as Exclude<CanvasT, 'body'>;
    const sections = this.sectionsByType[item].get();
    const previous = structuredClone(sections);

    const elementUuid = generateRandomString(8);
    column.element = {
      uuid: elementUuid,
      name: element.name,
      css: `.${element.css}-${elementUuid}{}`,
      config: element.config,
      text: element.text,
      dataText: [],
    };
    const sectionsUpdate = updateColumn(sections, column.uuid, column);
    const next = structuredClone(sectionsUpdate);
    this.sectionsByType[item].set(next);
    this._historyService.commit(item, previous, next);

    this._pageService.selectedItemsInGrid = {
      page: null,
      section: null,
      column: null,
      row: null,
      element: column.element,
      canvas: item,
    };
  }

  /**
   * Undo Changes
   */
  undo() {
    const selectedItemsInGrid = this._selectedItemsInGrid();
    const state = this._historyService.undo(selectedItemsInGrid?.canvas!);
    if (state) {
      this.sectionsByType[selectedItemsInGrid?.canvas! as Exclude<CanvasT, 'body'>].set(state);
      this.refreshSelectedItemsInGrid(state);
    }
  }

  /**
   * Redo changes
   */
  redo() {
    const selectedItemsInGrid = this._selectedItemsInGrid();
    const state = this._historyService.redo(selectedItemsInGrid?.canvas!);
    if (state) {
      this.sectionsByType[selectedItemsInGrid?.canvas! as Exclude<CanvasT, 'body'>].set(state);
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
      page: null,
      section: findSectionByUuid(state, selectedItemsInGrid?.section?.uuid ?? ''),
      row: findRowByUuid(state, selectedItemsInGrid?.row?.uuid ?? ''),
      column: findColumnByUuid(state, selectedItemsInGrid?.column?.uuid ?? ''),
      element: findElementByUuid(state, selectedItemsInGrid?.element?.uuid ?? ''),
      canvas: selectedItemsInGrid.canvas,
    };
  }
}
