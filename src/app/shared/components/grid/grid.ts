import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
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

@Component({
  selector: 'grid',
  templateUrl: './grid.html',
  imports: [NgClass, CdkDropList, CdkDrag, CdkDragHandle, ElementsComponent, TooltipDirective],
})
export class GridComponent implements OnInit {
  preview = input<boolean>(false);
  editContent = input<boolean>(false);
  editDesign = input<boolean>(false);
  gridType = input.required<string>();
  languageId = input<number>();
  previewType = input<string>('none');
  deleteSectionEvent = output<SectionI[]>();
  openElementPanel = output<ColumnI>();

  selectedItemsInGrid = signal<SelectedItemsInGridI>({
    section: null,
    row: null,
    column: null,
    element: null,
  });
  refreshGrid = signal<boolean>(false);
  selectedSection = signal<string | null>(null);
  selectedRow = signal<string | null>(null);
  selectedColumn = signal<string | null>(null);
  selectedElement = signal<string | null>(null);
  sectionsInCanvas = signal<SectionI[]>([]);

  private readonly _pageService = inject(PageService);

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
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this.updateSectionsInGrid();
  }

  /**
   * Add row to sections
   * @param row
   */
  addRow(section: SectionI) {
    const rowUuid = generateRandomString(8);
    section.rows.push({
      uuid: rowUuid,
      css: `.grid-row-${rowUuid}{}`,
      config: { backgroundImage: '' },
      columns: [],
    });

    this.updateSectionsInGrid();
  }

  /**
   * Add column to rows
   * @param row
   */
  addColumn(row: RowI) {
    const columnUuid = generateRandomString(8);
    row.columns.push({
      uuid: columnUuid,
      css: `.grid-column-${columnUuid}{}`,
      config: { backgroundImage: '' },
      element: null!,
    });
    this.updateSectionsInGrid();
  }

  /**
   * Add element to columns
   * @param column
   */
  addElement(column: ColumnI, element: ElementCMSI) {
    const elementUuid = generateRandomString(8);
    column.element = {
      uuid: elementUuid,
      name: element.name,
      css: `.${element.css}-${elementUuid}{}`,
      config: element.config,
      text: element.text,
    };

    this.updateSectionsInGrid();
  }

  /**
   * Open element panel
   * @param data
   */
  openElementsMangerModal(column: ColumnI): void {
    this.openElementPanel.emit(column);
  }

  /**
   * Update secctions in canvas grid
   */
  updateSectionsInGrid() {
    this._pageService.sections = [...this.sectionsInCanvas()];
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
