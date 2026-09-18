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
import * as _ from 'lodash';
import { Subject, takeUntil } from 'rxjs';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageService } from 'app/core/services/pages.service';

@Component({
  selector: 'grid',
  templateUrl: './grid.html',
  imports: [NgClass, CdkDropList, CdkDrag, CdkDragHandle, ElementsComponent, TooltipDirective],
})
export class GridComponent implements OnInit {
  preview = input<boolean>(false);
  editContent = input<boolean>(false);
  editDesign = input<boolean>(false);
  canvasEdit = input<boolean>(false);
  gridType = input<string>('body');
  languageId = input<number>();
  previewType = input<string>('none');
  grid = input<SectionI[]>([]);
  deleteSectionEvent = output<SectionI[]>();
  openElementPanel = output<ColumnI>();

  selectedItemsInGrid = signal<SelectedItemsInGridI>({
    section: null,
    row: null,
    column: null,
    element: null,
  });
  sections = signal<SectionI[]>([]);
  refreshGrid = signal<boolean>(false);
  selectedSection = signal<string | null>(null);
  selectedRow = signal<string | null>(null);
  selectedColumn = signal<string | null>(null);
  selectedElement = signal<string | null>(null);

  private readonly _pageService = inject(PageService);

  readonly sectionsInCanvas = toSignal(this._pageService.sections$, { initialValue: [] });

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const grid = this.grid();
      if (!this.canvasEdit()) {
        this.sections.set(grid);
        this.loadStyles();
      }
    });

    effect(() => {
      const grid = this.sectionsInCanvas();
      if (this.canvasEdit()) {
        this.sections.set(grid);
        this.loadStyles();
      }
    });

    this._pageService.sections$.pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (grid) => {
        this.refreshGrid.set(true);
        this.sections.set(grid);
        this.loadStyles();
        this.refreshGrid.set(false);
      },
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

    const grid = this.canvasEdit() ? this.sections() : this.grid();

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
   * Delete section to grid
   * @param uuid
   */
  deleteSection(uuid: string) {
    const grid = this.sections().filter((item) => item.uuid !== uuid);
    this.sections.set(grid);
    this.deleteSectionEvent.emit(this.sections());
    this.updateSectionsInGrid();
    this.resetSelectedItem();
  }

  /**
   * Delete row to section
   * @param uuid
   * @param section
   */
  deleteRow(uuid: string, section: SectionI) {
    section.rows = section.rows.filter((item) => item.uuid !== uuid);
    this.updateSectionsInGrid();
    this.resetSelectedItem();
  }

  /**
   * Delete column to row
   * @param uuid
   * @param row
   */
  deleteColumn(uuid: string, row: RowI) {
    row.columns = row.columns.filter((item) => item.uuid !== uuid);
    this.updateSectionsInGrid();
    this.resetSelectedItem();
  }

  /**
   * Delete element to column
   * @param column
   */
  deleteElement(column: ColumnI) {
    column.element = null!;
    this.updateSectionsInGrid();
    this.resetSelectedItem();
  }

  /**
   * Reset selected item
   */
  resetSelectedItem() {
    this._pageService.selectedItemsInGrid = {
      section: null,
      row: null,
      column: null,
      element: null,
    };
  }

  /**
   * Open modal settings detail
   *
   * @param data
   * @param item
   * @param isElemnet
   */
  openSettingsModal<T>(data: T, item: string, isElement: boolean): void {
    // const dataModal = _.cloneDeep(data);
    // const dialogRef = this._modalSvc.openModal<GridSettingsComponent, T>(GridSettingsComponent, {
    //   title: item,
    //   ...dataModal,
    //   isElement,
    // });
    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result !== null) {
    //     this.refreshElement.set(true);
    //     data['css'] = result.css;
    //     data['config'] = result.config;
    //     isElement && (data['dataText'] = result.dataText);
    //     this.loadStyles();
    //     this._changeDetectorRef.markForCheck();
    //     setTimeout(() => {
    //       this.refreshElement.set(false);
    //     }, 100);
    //   }
    // });
  }

  /**
   * Open element panel
   *
   * @param data
   */
  openElementsMangerModal(column: ColumnI): void {
    this.openElementPanel.emit(column);
  }

  /**
   * Update secctions in canvas grid
   */
  updateSectionsInGrid() {
    this._pageService.sections = this.sections();
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
