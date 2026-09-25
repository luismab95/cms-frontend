import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgClass, NgStyle } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ColumnI,
  ElementI,
  HistoryCMSI,
  PageElementsConfigI,
  RowI,
  SectionI,
  SelectedItemsInGridI,
} from 'app/shared/interfaces/grid.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
import {
  createRow,
  createSection,
  createColumn,
  updateColumn,
  createElement,
  filterPath,
} from 'app/shared/utils/grid.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { CanvasService } from 'app/core/services/canvas.service';
import { DynamicStyleService } from 'app/core/services/dynamic-style.service';
import { PageService } from 'app/core/services/pages.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { TemplateService } from 'app/core/services/templates.service';
import { ElementsComponent } from '../element/elements';

@Component({
  selector: 'grid',
  templateUrl: './grid.html',
  imports: [
    NgClass,
    NgStyle,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    ElementsComponent,
    TooltipDirective,
  ],
})
export class GridComponent implements OnDestroy {
  gridType = input.required<CanvasT>();
  gridStyles = input<any>({});
  pageElementsConfig = input.required<PageElementsConfigI>();
  preview = input<boolean>(false);
  editContent = input<boolean>(false);
  editDesign = input<boolean>(false);
  languageId = input<number>();
  previewType = input<string>('none');
  openElementsPanel = output<void>();

  selectedItemsInGrid = signal<SelectedItemsInGridI>({
    page: null,
    section: null,
    row: null,
    column: null,
    element: null,
    canvas: 'page',
  });

  private readonly _pageService = inject(PageService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _dynamicStyleService = inject(DynamicStyleService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _templateService = inject(TemplateService);

  readonly page = toSignal(this._pageService.page$, { initialValue: null });
  readonly template = toSignal(this._templateService.template$, { initialValue: null });
  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });

  readonly urlStatics = computed(
    () => findParameter('APP_STATICS_URL', this.parameters())?.value ?? '',
  );
  readonly sectionsInCanvas = computed(() => {
    return this._canvasService.sectionsByType[this.gridType()].get();
  });

  readonly gridConfigStyles = (config: { [key: string]: any }) => {
    const backgroundImage = config['backgroundImage'];
    if (!backgroundImage && backgroundImage !== '' && backgroundImage !== 'null') {
      return {};
    }

    return {
      'background-image': `url('${this.urlStatics()}/${filterPath(backgroundImage)}')`,
    };
  };

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      this.sectionsInCanvas();
      this.loadStyles();
    });

    effect(() => {
      this.sectionsInCanvas();
      this.loadStyles();
    });

    this._pageService.selectedItemsInGrid$.pipe(takeUntilDestroyed(this._destroyRef)).subscribe({
      next: (selectedItemsInGrid) => {
        this.selectedItemsInGrid.set(selectedItemsInGrid!);
      },
    });
  }

  /**
   * OnDestroy
   */
  ngOnDestroy(): void {
    this._dynamicStyleService.remove(`${this.gridType()}-dynamicSectionStyles`);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Load styles
   */
  loadStyles(): void {
    this._dynamicStyleService.remove(`${this.gridType()}-dynamicSectionStyles`);

    const styleId = `${this.gridType()}-dynamicSectionStyles`;
    document.getElementById(styleId)?.remove();

    const css: string[] = [];
    for (const section of this.sectionsInCanvas()) {
      css.push(section.css);
      for (const row of section.rows) {
        css.push(row.css);
        for (const column of row.columns) {
          css.push(column.css);
          if (column.element) {
            css.push(column.element.css);
          }
        }
      }
    }
    this._dynamicStyleService.set(styleId, css.join('\n'));
  }

  /**
   * Drag and drop event
   * @param event
   * @param item
   */
  drop<T>(event: CdkDragDrop<string[]>, items: T[]): void {
    const previous = structuredClone(this.sectionsInCanvas());
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this._canvasService.sectionsByType[this.gridType()].set(this.sectionsInCanvas());
    const next = structuredClone(this._canvasService.sectionsByType[this.gridType()].get());
    this._canvasService.updateChangesInCanvas(this.gridType(), previous, next);
  }

  /**
   * Add section to grid
   */
  addSection() {
    const newSection = createSection();
    const previous = structuredClone(this.sectionsInCanvas());
    this.currentSections = [...this.sectionsInCanvas(), newSection];
    this.updateSelectionItem({
      page: null,
      section: newSection,
      row: null,
      column: null,
      element: null,
      canvas: this.gridType(),
    });
    const next = structuredClone(this._canvasService.sectionsByType[this.gridType()].get());
    this._canvasService.updateChangesInCanvas(this.gridType(), previous, next);
  }

  /**
   * Add row to sections
   * @param row
   */
  addRow(section: SectionI) {
    const previous = structuredClone(this.sectionsInCanvas());
    const row = createRow();
    section.rows.push(row);
    this.updateSelectionItem({
      page: null,
      section: null,
      row,
      column: null,
      element: null,
      canvas: this.gridType(),
    });

    const next = structuredClone(this._canvasService.sectionsByType[this.gridType()].get());
    this._canvasService.updateChangesInCanvas(this.gridType(), previous, next);
  }

  /**
   * Add column to rows
   * @param row
   */
  addColumn(row: RowI) {
    const previous = structuredClone(this.sectionsInCanvas());
    const column = createColumn();
    row.columns.push(column);
    this.updateSelectionItem({
      page: null,
      section: null,
      row: null,
      column,
      element: null,
      canvas: this.gridType(),
    });

    const next = structuredClone(this._canvasService.sectionsByType[this.gridType()].get());
    this._canvasService.updateChangesInCanvas(this.gridType(), previous, next);
  }

  /**
   * add element in column
   * @param element
   * @returns
   */
  addElement(element: ElementCMSI) {
    const gridType = this.selectedItemsInGrid().canvas;
    const previous = structuredClone(this.sectionsInCanvas());
    const column = this.selectedItemsInGrid().column;
    if (!column) return;

    const newElement = createElement(element);
    const newColumn: ColumnI = { ...column, element: newElement };

    const newSections = updateColumn(previous, column.uuid, newColumn);
    this.currentSections = structuredClone(newSections);
    const next = structuredClone(this._canvasService.sectionsByType[gridType].get());
    this._canvasService.updateChangesInCanvas(gridType, previous, next);

    this.updateSelectionItem({
      page: null,
      section: null,
      row: null,
      column: null,
      element: newElement,
      canvas: gridType,
    });
  }

  /**
   * Open element panel
   * @param data
   */
  openElementsManagerPanel(column: ColumnI): void {
    this.openElementsPanel.emit();
    this.updateSelectionItem({
      ...this.selectedItemsInGrid(),
      column: column,
      canvas: this.selectedItemsInGrid().canvas,
    });
  }

  /**
   *
   */
  selectPageConfig() {
    this.updateSelectionItem({
      page: this.pageElementsConfig(),
      section: null,
      row: null,
      column: null,
      element: null,
      canvas: this.gridType()
    });
  }

  /**
   * Select a section and reset the nested selections.
   * @param section
   */
  selectSection(section: SectionI): void {
    this.updateSelectionItem({
      page: null,
      section,
      row: null,
      column: null,
      element: null,
      canvas: this.gridType(),
    });
  }

  /**
   * Select a row and reset the lower-level selections.
   * @param row
   */
  selectRow(row: RowI): void {
    this.updateSelectionItem({
      page: null,
      section: null,
      row,
      column: null,
      element: null,
      canvas: this.gridType(),
    });
  }

  /**
   * Select a column and clear the element selection.
   * @param column
   */
  selectColumn(column: ColumnI): void {
    this.updateSelectionItem({
      page: null,
      section: null,
      row: null,
      column,
      element: null,
      canvas: this.gridType(),
    });
  }

  /**
   * Select an element.
   * @param element
   */
  selectElement(element: ElementI): void {
    this.updateSelectionItem({
      page: null,
      section: null,
      row: null,
      column: null,
      element,
      canvas: this.gridType(),
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
   * Undo Changes
   */
  undo() {
    const state = this._canvasService.undo();
    if (state) {
      this.restoreState(state);
    }
  }

  /**
   * Redo changes
   */
  redo() {
    const state = this._canvasService.redo();
    if (state) {
      this.restoreState(state);
    }
  }

  /**
   * Restore state
   * @param state
   * @returns
   */
  restoreState(state: HistoryCMSI) {
    if (this.gridType() === 'page') {
      const page = this.page();
      if (!page) return;
      this._pageService.page = {
        ...page,
        data: {
          ...page.data,
          body: {
            ...state.body!,
          },
        },
      };
    } else {
      const template = this.template();
      if (!template) return;
      this._templateService.template = {
        ...template,
        data: {
          ...template.data,
          header: {
            ...state.header!,
          },
          footer: {
            ...state.footer!,
          },
        },
      };
    }
    this.updateSelectionItem({
      page: null,
      section: null,
      row: null,
      column: null,
      element: null,
      canvas: this.gridType(),
    });
  }

  private get currentSections(): SectionI[] {
    return this._canvasService.sectionsByType[this.gridType()].get();
  }

  private set currentSections(value: SectionI[]) {
    this._canvasService.sectionsByType[this.gridType()].set(value);
  }
}
