import { Component, signal, inject, input, output, DestroyRef, computed } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  ColumnI,
  ElementI,
  RowI,
  SectionI,
  SelectedItemsInGridI,
} from 'app/shared/interfaces/grid.interface';
import { ElementService } from 'app/core/services/element.service';
import { CanvasService } from 'app/core/services/canvas.service';
import { PageService } from 'app/core/services/pages.service';
import { TemplateService } from 'app/core/services/templates.service';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { ElementsManagerComponent } from '../elements-manager/elements-manager';
import { distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'layer-component',
  templateUrl: './layer.html',
  imports: [
    NgClass,
    CdkDropList,
    CdkDrag,
    TooltipDirective,
    ElementsManagerComponent,
    NgTemplateOutlet,
  ],
})
export class LayerComponent {
  gridType = input.required<CanvasT>();
  elementSelected = output<ElementCMSI | null>();

  layersCollapsed = signal<boolean>(false);
  isElementPanelOpen = signal<boolean>(false);
  selectedSection = signal<string | null>(null);
  selectedRow = signal<string | null>(null);
  selectedColumn = signal<string | null>(null);
  selectedElement = signal<string | null>(null);
  expandedSections = signal<Set<string>>(new Set());
  expandedRows = signal<Set<string>>(new Set());

  private readonly _elementService = inject(ElementService);
  private readonly _pageService = inject(PageService);
  private readonly _templateService = inject(TemplateService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly page = toSignal(this._pageService.page$, { initialValue: null });
  readonly template = toSignal(this._templateService.template$, { initialValue: null });
  readonly elements = toSignal(this._elementService.elements$, {
    initialValue: {
      records: [],
      total: 0,
      page: 0,
      totalPage: 0,
    },
  });

  readonly currentGridType = computed(() => this.gridType());
  readonly sectionsByType = computed(() => this._canvasService.sectionsByType);
  
  /**
   * Constructor
   */
  constructor() {
    this._pageService.selectedItemsInGrid$
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (selectedItemsInGrid) => {
          if (!selectedItemsInGrid) return;
          if (selectedItemsInGrid.section) this.selectSection(selectedItemsInGrid.section, false);
          if (selectedItemsInGrid.row) this.selectRow(selectedItemsInGrid.row, false);
          if (selectedItemsInGrid.column) this.selectColumn(selectedItemsInGrid.column, false);
          if (selectedItemsInGrid.element) this.selectElement(selectedItemsInGrid.element, false);
        },
      });
  }

  /**
   * toggle panel
   */
  toggleLayersAction = () => this.toggleLayers();
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
    this.setSelection(section.uuid);

    if (refresh) {
      this.updateSelectionItem({
        page: null,
        section,
        row: null,
        column: null,
        element: null,
        canvas: this.currentGridType(),
      });
    }
    this.toggleSection(section.uuid);
  }

  /**
   * Select a row and reset the lower-level selections.
   * @param row
   */
  selectRow(row: RowI, refresh: boolean = true): void {
    this.setSelection(this.selectedSection(), row.uuid);

    if (refresh) {
      this.updateSelectionItem({
        page: null,
        section: null,
        row,
        column: null,
        element: null,
        canvas: this.gridType(),
      });

      this.toggleRow(row.uuid);
    } else {
      const section = this.findSectionByRow(row.uuid);
      if (section) {
        this.selectedSection.set(section.uuid);
        this.expandSection(section.uuid);
      }
    }
  }

  /**
   * Select a column and clear the element selection.
   * @param column
   */
  selectColumn(column: ColumnI, refresh: boolean = true): void {
    this.setSelection(this.selectedSection(), this.selectedRow(), column.uuid);
    this.expandHierarchyFromColumn(column.uuid);

    if (refresh)
      this.updateSelectionItem({
        page: null,
        section: null,
        row: null,
        column,
        element: null,
        canvas: this.currentGridType(),
      });
  }

  /**
   * Select an element.
   * @param element
   */
  selectElement(element: ElementI, refresh: boolean = true): void {
    this.setSelection(
      this.selectedSection(),
      this.selectedRow(),
      this.selectedColumn(),
      element.uuid,
    );

    const column = this.findColumnByElement(element.uuid);
    if (column) {
      this.selectedColumn.set(column.uuid);
      this.expandHierarchyFromColumn(column.uuid);
    }

    if (refresh)
      this.updateSelectionItem({
        page: null,
        section: null,
        row: null,
        column: null,
        element,
        canvas: this.currentGridType(),
      });
  }

  /**
   * Toggle a section expansion state.
   * @param uuid
   */
  toggleSection(uuid: string): void {
    this.expandedSections.set(new Set([uuid]));
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
  getElementIcon(element: ElementI): string {
    return this.elements().records.find((f) => f.name === element.name)?.icon ?? 'fa-solid fa-cube';
  }

  /**
   * Drag and drop event
   * @param event
   * @param item
   */
  drop<T>(event: CdkDragDrop<string[]>, items: T[]): void {
    const previous = structuredClone(this.currentSections);
    moveItemInArray(items, event.previousIndex, event.currentIndex);
    const next = structuredClone(this.currentSections);
    this.currentSections = next;
    this._canvasService.updateChangesInCanvas(this.gridType(), previous, next);
  }

  /**
   * Selected items
   * @param selectedItemsInGrid
   */
  updateSelectionItem(selectedItemsInGrid: SelectedItemsInGridI): void {
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
  closeElementPanelAction = () => this.closeElementPanel();
  closeElementPanel(): void {
    this.isElementPanelOpen.set(false);
    this.elementSelected.emit(null);
  }

  /**
   * select element
   */
  selectElementPanel(element: ElementCMSI): void {
    this.isElementPanelOpen.set(false);
    this.elementSelected.emit(element);
  }

  /**
   *
   * @param rowUuid
   * @returns
   */
  private findSectionByRow(rowUuid: string): SectionI | undefined {
    return this.currentSections.find((section) => section.rows.some((row) => row.uuid === rowUuid));
  }

  /**
   *
   * @param columnUuid
   * @returns
   */
  private findRowByColumn(columnUuid: string): RowI | undefined {
    for (const section of this.currentSections) {
      const row = section.rows?.find((row) =>
        row.columns?.some((column) => column.uuid === columnUuid),
      );
      if (row) {
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
    for (const section of this.currentSections) {
      for (const row of section.rows ?? []) {
        const column = row.columns?.find((column) => column.element?.uuid === columnElementUuid);
        if (column) {
          return column;
        }
      }
    }
    return undefined;
  }

  /**
   * currentSections
   */
  private get currentSections(): SectionI[] {
    return this._canvasService.sectionsByType[this.currentGridType()].get();
  }

  /**
   * currentSections
   */
  private set currentSections(sections: SectionI[]) {
    this._canvasService.sectionsByType[this.currentGridType()].set(sections);
  }

  /**
   * expandItem
   * @param columnUuid
   */
  private expandHierarchyFromColumn(columnUuid: string): void {
    const row = this.findRowByColumn(columnUuid);
    if (!row) return;

    this.selectedRow.set(row.uuid);
    this.expandRow(row.uuid);

    const section = this.findSectionByRow(row.uuid);
    if (section) {
      this.selectedSection.set(section.uuid);
      this.expandSection(section.uuid);
    }
  }

  /**
   * Set selection Item
   * @param section
   * @param row
   * @param column
   * @param element
   */
  private setSelection(
    section: string | null = null,
    row: string | null = null,
    column: string | null = null,
    element: string | null = null,
  ): void {
    this.selectedSection.set(section);
    this.selectedRow.set(row);
    this.selectedColumn.set(column);
    this.selectedElement.set(element);
  }
}
