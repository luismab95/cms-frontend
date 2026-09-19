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
import { toSignal } from '@angular/core/rxjs-interop';
import { SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';
import {
  COLUMNFORMTYPESCONFIG,
  ROWFORMTYPESCONFIG,
  SECTIONFORMTYPESCONFIG,
} from 'app/shared/utils/grid.utils';
import { DynamicForm, FormConfig, RegisteredFieldTypes } from '@ng-forge/dynamic-forms';
import { Subject } from 'rxjs';

@Component({
  selector: 'properties-inspector-component',
  templateUrl: './properties-inspector.html',
  imports: [FormsModule, ReactiveFormsModule, DynamicForm],
})
export class PropertiesInspectorComponent implements OnInit, OnDestroy {
  itemSelectedInGrid = input.required<SelectedItemsInGridI | null>();

  fields = signal<RegisteredFieldTypes[]>([]);
  values = signal<{ [key: string]: string }>({});

  private _unsubscribeAll = new Subject<void>();

  private readonly _elementService = inject(ElementService);
  readonly elements = toSignal(this._elementService.elements$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  config = computed(() => ({
    fields: this.fields().map((field) => ({
      ...field,
      value: this.values()?.[field.key],
    })),
  } ));

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
   *
   */
  constructor() {
    effect(() => {
      const itemSelectedInGrid = this.itemSelectedInGrid();
      if (itemSelectedInGrid == null) return;
      if (itemSelectedInGrid.element !== null) {
        this.fields.set(this.getElementConfig(itemSelectedInGrid.element.name));
        this.values.set(itemSelectedInGrid.element?.config!);
      }
      if (itemSelectedInGrid.column !== null) {
        this.fields.set(COLUMNFORMTYPESCONFIG);
        this.values.set(itemSelectedInGrid.column?.config!);
      }
      if (itemSelectedInGrid.row !== null) {
        this.fields.set(ROWFORMTYPESCONFIG);
        this.values.set(itemSelectedInGrid.row?.config!);
      }
      if (itemSelectedInGrid.section !== null) {
        this.fields.set(SECTIONFORMTYPESCONFIG);
        this.values.set(itemSelectedInGrid.section?.config!);
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
}
