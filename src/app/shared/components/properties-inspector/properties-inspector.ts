import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  input,
  signal,
  effect,
  computed,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ElementService } from 'app/core/services/element.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { SectionI, SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';
import {
  COLUMNFORMTYPESCONFIG,
  ROWFORMTYPESCONFIG,
  SECTIONFORMTYPESCONFIG,
  updateColumn,
  updateElement,
  updateRow,
  updateSection,
} from 'app/shared/utils/grid.utils';
import { DynamicForm, EventDispatcher, RegisteredFieldTypes } from '@ng-forge/dynamic-forms';
import { PageService } from 'app/core/services/pages.service';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { pairwise, skip, Subject, takeUntil } from 'rxjs';

@Component({
  providers: [EventDispatcher],
  selector: 'properties-inspector-component',
  templateUrl: './properties-inspector.html',
  imports: [FormsModule, ReactiveFormsModule, DynamicForm],
})
export class PropertiesInspectorComponent implements OnInit, OnDestroy {
  itemSelectedInGrid = input.required<SelectedItemsInGridI | null>();

  fields = signal<RegisteredFieldTypes[]>([]);
  formValue = signal<Record<string, unknown>>({});

  private _unsubscribeAll = new Subject<void>();

  private readonly _elementService = inject(ElementService);
  private readonly _pageService = inject(PageService);
  private readonly _historyService = inject(HistoryService);

  readonly sectionsInCanvas = this._pageService.sections;

  readonly elements = toSignal(this._elementService.elements$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  config = computed(() => ({
    fields: this.fields().map((field) => ({
      ...field,
    })),
  }));

  typeItem = computed(() => {
    const selectedItem = this.itemSelectedInGrid();

    if (!selectedItem) {
      return 'page';
    }

    if (selectedItem.element !== null) return 'element';
    if (selectedItem.column !== null) return 'column';
    if (selectedItem.row !== null) return 'row';
    if (selectedItem.section !== null) return 'section';

    return 'page';
  });

  /**
   * Constructort
   */
  constructor() {
    toObservable(this.formValue)
      .pipe(skip(1), pairwise(), takeUntil(this._unsubscribeAll))
      .subscribe(([previous, current]) => {
        const changed = Object.keys(current).some((key) => previous[key] !== current[key]);
        if (changed) {
          this.updateItem(current);
        }
      });

    effect(() => {
      const itemSelectedInGrid = this.itemSelectedInGrid();
      if (itemSelectedInGrid == null) return;
      if (itemSelectedInGrid.element !== null) {
        this.fields.set(this.getElementConfig(itemSelectedInGrid.element.name));
        this.formValue.set(itemSelectedInGrid.element?.config!);
      }
      if (itemSelectedInGrid.column !== null) {
        this.fields.set(COLUMNFORMTYPESCONFIG);
        this.formValue.set(itemSelectedInGrid.column?.config!);
      }
      if (itemSelectedInGrid.row !== null) {
        this.fields.set(ROWFORMTYPESCONFIG);
        this.formValue.set(itemSelectedInGrid.row?.config!);
      }
      if (itemSelectedInGrid.section !== null) {
        this.fields.set(SECTIONFORMTYPESCONFIG);
        this.formValue.set(itemSelectedInGrid.section?.config!);
      }
    });
  }

  /**
   * OnInit
   * @returns
   */
  ngOnInit(): void {}

  /**
   * OnDestroy
   */
  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  /**
   * Get element type
   */
  getElementConfig(name: string): RegisteredFieldTypes[] {
    return this.elements().records.find((element) => element.name === name)?.type ?? [];
  }

  /**
   * Update secctions in canvas grid
   * @param next
   */
  updateSectionsInGrid(previous: SectionI[], next: SectionI[]) {
    this._pageService.sections = next;
    this._historyService.commit(previous, next);
  }

  /**
   * Update item
   * @param value
   */
  updateItem(value: Record<string, unknown>) {
    const previous = structuredClone(this.sectionsInCanvas());
    let next = structuredClone(this.sectionsInCanvas());
    switch (this.typeItem()) {
      case 'section':
        const section = this.itemSelectedInGrid()?.section;
        if (section) {
          section.config = value;
          const sections = updateSection(this.sectionsInCanvas(), section.uuid, section);
          next = structuredClone(sections);
        }
        break;
      case 'row':
        const row = this.itemSelectedInGrid()?.row;
        if (row) {
          row.config = value;
          const sections = updateRow(this.sectionsInCanvas(), row.uuid, row);
          next = structuredClone(sections);
        }
        break;
      case 'column':
        const column = this.itemSelectedInGrid()?.column;
        if (column) {
          column.config = value;
          const sections = updateColumn(this.sectionsInCanvas(), column.uuid, column);
          next = structuredClone(sections);
        }
        break;
      case 'element':
        const element = this.itemSelectedInGrid()?.element;
        if (element) {
          element.config = value;
          const sections = updateElement(this.sectionsInCanvas(), element.uuid, element);
          next = structuredClone(sections);
        }
        break;
    }
    this.updateSectionsInGrid(previous, next);
  }
}
