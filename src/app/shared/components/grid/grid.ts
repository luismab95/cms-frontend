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
  findSectionByUuid,
  findRowByUuid,
  findColumnByUuid,
  findElementByUuid,
  updateColumn,
  createElement,
  filterPath,
} from 'app/shared/utils/grid.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { DynamicStyleService } from 'app/core/services/dynamic-style.service';
import { PageService } from 'app/core/services/pages.service';
import { ParameterService } from 'app/core/services/parameter.service';
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
    canvas: 'body',
  });

  private readonly _pageService = inject(PageService);
  private readonly _historyService = inject(HistoryService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _dynamicStyleService = inject(DynamicStyleService);
  private readonly _parameterService = inject(ParameterService);

  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });
  readonly sectionsHeader = this._pageService.sectionsHeader;
  readonly sections = this._pageService.sections;
  readonly sectionsFooter = this._pageService.sectionsFooter;

  readonly urlStatics = computed(
    () => findParameter('APP_STATICS_URL', this.parameters())?.value ?? '',
  );
  readonly sectionsInCanvas = computed(() => {
    return this.sectionsByType[this.gridType()].get();
  });

  readonly sectionsByType = {
    header: {
      get: () => this.sectionsHeader(),
      set: (sections: SectionI[]) => {
        this._pageService.sectionsHeader = sections;
      },
    },

    body: {
      get: () => this.sections(),
      set: (sections: SectionI[]) => {
        this._pageService.sections = sections;
      },
    },

    footer: {
      get: () => this.sectionsFooter(),
      set: (sections: SectionI[]) => {
        this._pageService.sectionsFooter = sections;
      },
    },
  } satisfies Record<
    CanvasT,
    {
      get: () => SectionI[];
      set: (sections: SectionI[]) => void;
    }
  >;
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
    this.updateSectionsInGrid(previous);
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

    this.updateSectionsInGrid(previous);
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

    this.updateSectionsInGrid(previous);
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

    this.updateSectionsInGrid(previous);
  }

  /**
   * add element in column
   * @param element
   * @returns
   */
  addElement(element: ElementCMSI) {
    const previous = structuredClone(this.sectionsInCanvas());
    const column = this.selectedItemsInGrid().column;
    if (!column) return;

    const newElement = createElement(element);
    const newColumn: ColumnI = { ...column, element: newElement };

    const next = updateColumn(previous, column.uuid, newColumn);
    this.currentSections = structuredClone(next);
    this.updateSectionsInGrid(previous);

    this.updateSelectionItem({
      page: null,
      section: null,
      row: null,
      column: null,
      element: newElement,
      canvas: this.gridType(),
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
      canvas: this.gridType(),
    });
  }

  /**
   * Update secctions in canvas grid
   */
  updateSectionsInGrid(previous: SectionI[]) {
    const next = structuredClone(this.sectionsInCanvas());
    this._historyService.commit(this.gridType(), previous, next);
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
      canvas: this.gridType(),
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
    const state = this._historyService.undo(this.gridType());
    if (state) {
      this.currentSections = structuredClone(state);
      this.refreshSelectedItemsInGrid(state);
    }
  }

  /**
   * Redo changes
   */
  redo() {
    const state = this._historyService.redo(this.gridType());
    if (state) {
      this.currentSections = structuredClone(state);
      this.refreshSelectedItemsInGrid(state);
    }
  }

  /**
   * Refresh selections
   */
  refreshSelectedItemsInGrid(state: SectionI[]) {
    const selectedItemsInGrid = this.selectedItemsInGrid();

    if (selectedItemsInGrid === null) return;
    this.updateSelectionItem({
      page: null,
      section: findSectionByUuid(state, selectedItemsInGrid?.section?.uuid ?? ''),
      row: findRowByUuid(state, selectedItemsInGrid?.row?.uuid ?? ''),
      column: findColumnByUuid(state, selectedItemsInGrid?.column?.uuid ?? ''),
      element: findElementByUuid(state, selectedItemsInGrid?.element?.uuid ?? ''),
      canvas: this.gridType(),
    });
  }

  private get currentSections(): SectionI[] {
    return this.sectionsByType[this.gridType()].get();
  }

  private set currentSections(value: SectionI[]) {
    this.sectionsByType[this.gridType()].set(value);
  }
}
