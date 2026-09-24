import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import {
  ColumnI,
  ElementI,
  RowI,
  SectionI,
  SelectedItemsInGridI,
} from 'app/shared/interfaces/grid.interface';
import { ElementsComponent } from '../element/elements';
import { generateRandomString } from 'app/shared/utils/random.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { PageService } from 'app/core/services/pages.service';
import { Subject, takeUntil } from 'rxjs';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { CanvasT } from 'app/core/interfaces/page.interface';

@Component({
  selector: 'grid',
  templateUrl: './grid.html',
  imports: [NgClass, CdkDropList, CdkDrag, CdkDragHandle, ElementsComponent, TooltipDirective],
})
export class GridComponent implements OnInit {
  preview = input<boolean>(false);
  editContent = input<boolean>(false);
  editDesign = input<boolean>(false);
  gridType = input.required<CanvasT>();
  languageId = input<number>();
  previewType = input<string>('none');
  deleteSectionEvent = output<SectionI[]>();
  openElementPanel = output<ColumnI>();

  selectedItemsInGrid = signal<SelectedItemsInGridI>({
    section: null,
    row: null,
    column: null,
    element: null,
    canvas: 'body',
  });
  refreshGrid = signal<boolean>(false);
  selectedSection = signal<string | null>(null);
  selectedRow = signal<string | null>(null);
  selectedColumn = signal<string | null>(null);
  selectedElement = signal<string | null>(null);
  sectionsInCanvas = signal<SectionI[]>([]);

  private readonly _pageService = inject(PageService);
  private readonly _historyService = inject(HistoryService);

  readonly sectionsHeader = this._pageService.sectionsHeader;
  readonly sections = this._pageService.sections;
  readonly sectionsFooter = this._pageService.sectionsFooter;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const gridType = this.gridType();
      switch (gridType) {
        case 'header':
          this.sectionsInCanvas.set(this.sectionsHeader());
          break;
        case 'body':
          this.sectionsInCanvas.set(this.sections());
          break;
        case 'footer':
          this.sectionsInCanvas.set(this.sectionsFooter());
          break;
      }
      this.loadStyles();
    });

    this._pageService.selectedItemsInGrid$.pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (selectedItemsInGrid) => {
        this.refreshGrid.set(true);
        this.selectedItemsInGrid.set(selectedItemsInGrid!);
        this.refreshGrid.set(false);
      },
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Load CSS
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
   * Load styles
   */
  loadStyles() {
    const styleElementToRemove = document.getElementById(`${this.gridType}-dynamicSectionStyles`);
    if (styleElementToRemove) {
      styleElementToRemove.remove();
    }
    const styleElement = document.createElement('style');
    styleElement.id = `${this.gridType}-dynamicSectionStyles`;

    const grid = this.sectionsInCanvas();

    grid.forEach((section) => {
      styleElement.textContent += `${section.css}`;
      section.rows.forEach((row) => {
        styleElement.textContent += `${row.css}`;
        row.columns.forEach((column) => {
          styleElement.textContent += `${column.css}`;
          if (column.element) {
            styleElement.textContent += `${column.element.css}`;
          }
        });
      });
    });
    document.head.appendChild(styleElement);
  }

  /**
   * Drag and drop event
   * @param event
   * @param item
   */
  drop<T>(event: CdkDragDrop<string[]>, items: T[]) {
    const previous = structuredClone(this.sectionsInCanvas());
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.updateSectionsInGrid(previous);
  }

  /**
   * Add row to sections
   * @param row
   */
  addRow(section: SectionI) {
    const previous = structuredClone(this.sectionsInCanvas());
    const rowUuid = generateRandomString(8);
    const row = {
      uuid: rowUuid,
      css: `.grid-row-${rowUuid}{}`,
      config: { backgroundImage: '' },
      columns: [],
    } as RowI;

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
    const columnUuid = generateRandomString(8);
    const column = {
      uuid: columnUuid,
      css: `.grid-column-${columnUuid}{}`,
      config: { backgroundImage: '' },
      element: null!,
    } as ColumnI;

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
  openElementsMangerModal(column: ColumnI): void {
    this.openElementPanel.emit(column);
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
    if (this.gridType() === 'header') {
      this._pageService.sectionsHeader = next;
      // this._historyService.commit(previous, next);
    }
    if (this.gridType() === 'footer') {
      this._pageService.sectionsFooter = next;
      // this._historyService.commit(previous, next);
    }
    if (this.gridType() === 'body') {
      this._pageService.sections = next;
      this._historyService.commit(previous, next);
    }
  }

  /**
   * Select a section and reset the nested selections.
   * @param section
   */
  selectSection(section: SectionI): void {
    this.selectedSection.set(section.uuid);
    this.selectedRow.set(null);
    this.selectedColumn.set(null);
    this.selectedElement.set(null);

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
    this.selectedRow.set(row.uuid);
    this.selectedColumn.set(null);
    this.selectedElement.set(null);

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
    this.selectedColumn.set(column.uuid);
    this.selectedElement.set(null);

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
    this.selectedElement.set(element.uuid);

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
}
