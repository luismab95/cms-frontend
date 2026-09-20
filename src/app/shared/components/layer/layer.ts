import { Component, OnInit, signal, inject, effect, OnDestroy, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ColumnI,
  ElementI,
  RowI,
  SectionI,
  SelectedItemsInGridI,
} from 'app/shared/interfaces/grid.interface';
import { ElementService } from 'app/core/services/element.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageService } from 'app/core/services/pages.service';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { ElementsManagerComponent } from '../elements-manager/elements-manager';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';

@Component({
  selector: 'layer-component',
  templateUrl: './layer.html',
  imports: [NgClass, CdkDropList, CdkDrag, TooltipDirective, ElementsManagerComponent],
})
export class LayerComponent implements OnInit, OnDestroy {
  showComponetsPanel = input<boolean>(true);
  elementSelected = output<ElementCMSI | null>();

  layersCollapsed = signal<boolean>(false);
  isElementPanelOpen = signal<boolean>(false);
  selectedSection = signal<string | null>(null);
  selectedRow = signal<string | null>(null);
  selectedColumn = signal<string | null>(null);
  selectedElement = signal<string | null>(null);
  expandedSections = signal<Set<string>>(new Set());
  expandedRows = signal<Set<string>>(new Set());

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _elementService = inject(ElementService);
  private readonly _pageService = inject(PageService);

  readonly sectionsInCanvas = this._pageService.sections;

  readonly elements = toSignal(this._elementService.elements$, {
    initialValue: {
      records: [],
      total: 0,
      page: 0,
      totalPage: 0,
    },
  });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const showComponetsPanel = this.showComponetsPanel();
      this.isElementPanelOpen.set(showComponetsPanel);
      this.layersCollapsed.set(false);
    });

    this._pageService.selectedItemsInGrid$
      .pipe(distinctUntilChanged(), takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (selectedItemsInGrid) => {
          if (selectedItemsInGrid == null) return;
          if (selectedItemsInGrid?.section !== null)
            this.selectSection(selectedItemsInGrid?.section!, false);
          if (selectedItemsInGrid?.row !== null) this.selectRow(selectedItemsInGrid?.row!, false);
          if (selectedItemsInGrid?.column !== null)
            this.selectColumn(selectedItemsInGrid?.column!, false);
          if (selectedItemsInGrid?.element !== null)
            this.selectElement(selectedItemsInGrid?.element!, false);
        },
      });
  }

  /**
   * On Init
   */
  ngOnInit(): void {}

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  /**
   * toggle panel
   */
  toggleLayers(): void {
    this.layersCollapsed.update((collapsed) => !collapsed);
  }

  /**
   * open panel
   */
  openLayers(): void {
    this.layersCollapsed.set(true);
  }

  /**
   * close panel
   */
  closeLayers(): void {
    this.layersCollapsed.set(false);
  }

  /**
   * Select a section and reset the nested selections.
   * @param section
   */
  selectSection(section: SectionI, refresh: boolean = true): void {
    this.selectedSection.set(section.uuid);
    this.selectedRow.set(null);
    this.selectedColumn.set(null);
    this.selectedElement.set(null);

    if (refresh) {
      this.updateSelectionItem({
        section,
        row: null,
        column: null,
        element: null,
      });
    }
    this.toggleSection(section.uuid);
  }

  /**
   * Select a row and reset the lower-level selections.
   * @param row
   */
  selectRow(row: RowI, refresh: boolean = true): void {
    this.selectedRow.set(row.uuid);
    this.selectedColumn.set(null);
    this.selectedElement.set(null);

    if (refresh) {
      this.updateSelectionItem({
        section: null,
        row,
        column: null,
        element: null,
      });

      this.toggleRow(row.uuid);
    } else {
      const section = this.findSectionByRow(row.uuid);
      if (section) {
        this.expandSection(section.uuid);
      }
    }
  }

  /**
   * Select a column and clear the element selection.
   * @param column
   */
  selectColumn(column: ColumnI, refresh: boolean = true): void {
    this.selectedColumn.set(column.uuid);
    this.selectedElement.set(null);

    const row = this.findRowByColumn(column.uuid);
    if (row) {
      this.expandRow(row.uuid);
      const section = this.findSectionByRow(row.uuid);
      if (section) {
        this.expandSection(section.uuid);
      }
    }

    if (refresh)
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
  selectElement(element: ElementI, refresh: boolean = true): void {
    this.selectedElement.set(element.uuid);

    const column = this.findColumnByElement(element.uuid);
    if (column) {
      const row = this.findRowByColumn(column.uuid);
      if (row) {
        this.expandRow(row.uuid);
        const section = this.findSectionByRow(row.uuid);
        if (section) {
          this.expandSection(section.uuid);
        }
      }
    }

    if (refresh)
      this.updateSelectionItem({
        section: null,
        row: null,
        column: null,
        element,
      });
  }

  /**
   * Toggle a section expansion state.
   * @param uuid
   */
  toggleSection(uuid: string): void {
    const sectionOpen = new Set<string>();
    sectionOpen.add(uuid);
    this.expandedSections.set(sectionOpen);
  }

  /**
   * Toggle a row expansion state.
   * @param uuid
   */
  toggleRow(uuid: string): void {
    this.expandedRows.update((current) => {
      const next = new Set(current);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.clear();
        next.add(uuid);
      }

      return next;
    });
  }

  /**
   * Check whether a section is expanded.
   * @param uuid
   * @returns
   */
  isSectionExpanded(uuid: string): boolean {
    return this.expandedSections().has(uuid);
  }

  /**
   * Check whether a row is expanded.
   * @param uuid
   * @returns
   */
  isRowExpanded(uuid: string): boolean {
    return this.expandedRows().has(uuid);
  }

  /**
   * Check whether a section is selected.
   * @param uuid
   * @returns
   */
  isSectionSelected(uuid: string): boolean {
    return this.selectedSection() === uuid;
  }

  /**
   * Check whether a row is selected.
   * @param uuid
   * @returns
   */
  isRowSelected(uuid: string): boolean {
    return this.selectedRow() === uuid;
  }

  /**
   * Check whether a column is selected.
   * @param uuid
   * @returns
   */
  isColumnSelected(uuid: string): boolean {
    return this.selectedColumn() === uuid;
  }

  /**
   * Check whether an element is selected.
   * @param uuid
   * @returns
   */
  isElementSelected(uuid: string): boolean {
    return this.selectedElement() === uuid;
  }

  /**
   * Get element icon
   * @param element
   * @returns
   */
  getElementIcon(element: ElementI) {
    return this.elements().records.find((f) => f.name === element.name)?.icon ?? 'fa-solid fa-cube';
  }

  /**
   * Drag and drop event
   * @param event
   * @param item
   */
  drop<T>(event: CdkDragDrop<string[]>, items: T[]) {
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    this._pageService.sections = [...this.sectionsInCanvas()];
  }

  /**
   * Selected items
   * @param selectedItemsInGrid
   */
  updateSelectionItem(selectedItemsInGrid: SelectedItemsInGridI) {
    this._pageService.selectedItemsInGrid = selectedItemsInGrid;
  }

  /**
   * Expand a section if it is not already expanded.
   * @param uuid
   */
  expandSection(uuid: string): void {
    this.expandedSections.update((current) => {
      if (current.has(uuid)) {
        return current;
      }
      const next = new Set(current);
      next.add(uuid);
      return next;
    });
  }

  /**
   * Expand a row if it is not already expanded.
   * @param uuid
   */
  expandRow(uuid: string): void {
    this.expandedRows.update((current) => {
      if (current.has(uuid)) {
        return current;
      }
      const next = new Set(current);
      next.clear();
      next.add(uuid);
      return next;
    });
  }

  /**
   * Close Element panel
   */
  closeElementPanel() {
    this.elementSelected.emit(null);
  }

  /**
   * select element
   */
  selectElementPanel(element: ElementCMSI) {
    this.elementSelected.emit(element);
  }

  /**
   *
   * @param rowUuid
   * @returns
   */
  private findSectionByRow(rowUuid: string): SectionI | undefined {
    const section = this.sectionsInCanvas().find((section) =>
      section.rows?.some((row) => row.uuid === rowUuid),
    );

    if (section) {
      this.selectedSection.set(section.uuid);
      this.toggleSection(section.uuid);
      return section;
    }
    return undefined;
  }

  /**
   *
   * @param columnUuid
   * @returns
   */
  private findRowByColumn(columnUuid: string): RowI | undefined {
    for (const section of this.sectionsInCanvas()) {
      const row = section.rows?.find((row) =>
        row.columns?.some((column) => column.uuid === columnUuid),
      );
      if (row) {
        this.selectedRow.set(row.uuid);
        return row;
      }
    }
    return undefined;
  }

  /**
   *
   * @param columnElementUuid
   * @returns
   */
  private findColumnByElement(columnElementUuid: string): ColumnI | undefined {
    for (const section of this.sectionsInCanvas()) {
      for (const row of section.rows ?? []) {
        const column = row.columns?.find((column) => column.element?.uuid === columnElementUuid);
        if (column) {
          this.selectedColumn.set(column.uuid);
          return column;
        }
      }
    }
    return undefined;
  }
}
