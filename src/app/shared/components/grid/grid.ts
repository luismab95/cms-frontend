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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ColumnI,
  ElementI,
  RowI,
  SectionI,
  SelectedItemsInGridI,
} from 'app/shared/interfaces/grid.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import { createRow, createSection, createColumn } from 'app/shared/utils/grid.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { DynamicStyleService } from 'app/core/services/dynamic-style.service';
import { PageService } from 'app/core/services/pages.service';
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
  preview = input<boolean>(false);
  editContent = input<boolean>(false);
  editDesign = input<boolean>(false);
  languageId = input<number>();
  previewType = input<string>('none');

  selectedItemsInGrid = signal<SelectedItemsInGridI>({
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

  readonly sectionsHeader = this._pageService.sectionsHeader;
  readonly sections = this._pageService.sections;
  readonly sectionsFooter = this._pageService.sectionsFooter;

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
      section: null,
      row: null,
      column,
      element: null,
      canvas: this.gridType(),
    });

    this.updateSectionsInGrid(previous);
  }

  /**
   * Open element panel
   * @param data
   */
  openElementsManagerModal(column: ColumnI): void {
    this.updateSelectionItem({
      ...this.selectedItemsInGrid(),
      canvas: this.gridType(),
    });
  }

  /**
   * Update secctions in canvas grid
   */
  updateSectionsInGrid(previous: SectionI[]) {
    const next = structuredClone(this.sectionsInCanvas());
    this.currentSections = next;
    this._historyService.commit(this.gridType(), previous, next);
  }

  /**
   * Select a section and reset the nested selections.
   * @param section
   */
  selectSection(section: SectionI): void {
    this.updateSelectionItem({
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

  private get currentSections(): SectionI[] {
    return this.sectionsByType[this.gridType()].get();
  }

  private set currentSections(value: SectionI[]) {
    this.sectionsByType[this.gridType()].set(value);
  }
}
