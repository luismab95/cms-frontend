import { Component, inject, input, signal, effect, computed, DestroyRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { DynamicForm, EventDispatcher, RegisteredFieldTypes } from '@ng-forge/dynamic-forms';
import { SectionI, SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import {
  COLUMNFORMTYPESCONFIG,
  PAGEFORMTYPESCONFIG,
  ROWFORMTYPESCONFIG,
  SECTIONFORMTYPESCONFIG,
  updateColumn,
  updateConfigPageElement,
  updateElement,
  updateRow,
  updateSection,
} from 'app/shared/utils/grid.utils';
import { ElementService } from 'app/core/services/element.service';
import { PageService } from 'app/core/services/pages.service';
import { CanvasService } from 'app/core/services/canvas.service';
import { TemplateService } from 'app/core/services/templates.service';
import { debounceTime, pairwise, skip } from 'rxjs';

@Component({
  providers: [EventDispatcher],
  selector: 'properties-inspector-component',
  templateUrl: './properties-inspector.html',
  imports: [FormsModule, ReactiveFormsModule, DynamicForm],
})
export class PropertiesInspectorComponent {
  itemSelectedInGrid = input.required<SelectedItemsInGridI | null>();
  gridType = input.required<CanvasT>();

  fields = signal<RegisteredFieldTypes[]>([]);
  formValue = signal<Record<string, unknown>>({});

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _elementService = inject(ElementService);
  private readonly _pageService = inject(PageService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _templateService = inject(TemplateService);

  readonly page = toSignal(this._pageService.page$, { initialValue: null });
  readonly template = toSignal(this._templateService.template$, { initialValue: null });
  readonly elements = toSignal(this._elementService.elements$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  readonly config = computed(() => ({
    fields: this.fields(),
  }));
  readonly typeItem = computed(() => {
    const item = this.itemSelectedInGrid();

    return item?.element
      ? 'element'
      : item?.column
        ? 'column'
        : item?.row
          ? 'row'
          : item?.section
            ? 'section'
            : 'page';
  });
  readonly elementTypes = computed(
    () => new Map(this.elements().records.map((e) => [e.name, e.type])),
  );

  readonly inspectors = {
    section: {
      fields: SECTIONFORMTYPESCONFIG,
      config: (i: SelectedItemsInGridI) => i.section?.config,
    },
    row: {
      fields: ROWFORMTYPESCONFIG,
      config: (i: SelectedItemsInGridI) => i.row?.config,
    },
    column: {
      fields: COLUMNFORMTYPESCONFIG,
      config: (i: SelectedItemsInGridI) => i.column?.config,
    },
    page: {
      fields: PAGEFORMTYPESCONFIG,
      config: (i: SelectedItemsInGridI) => i.page?.config,
    },
  };
  readonly updateStrategies = {
    section: {
      getItem: (selected: SelectedItemsInGridI) => selected.section,
      update: updateSection,
    },
    row: {
      getItem: (selected: SelectedItemsInGridI) => selected.row,
      update: updateRow,
    },
    column: {
      getItem: (selected: SelectedItemsInGridI) => selected.column,
      update: updateColumn,
    },
    element: {
      getItem: (selected: SelectedItemsInGridI) => selected.element,
      update: updateElement,
    },
  };

  /**
   * Constructort
   */
  constructor() {
    toObservable(this.formValue)
      .pipe(skip(1), debounceTime(600), pairwise(), takeUntilDestroyed(this._destroyRef))
      .subscribe(([previous, current]) => {
        const changed = Object.keys(current).some((key) => previous[key] !== current[key]);
        if (changed) {
          this.updateItem(current);
        }
      });

    effect(() => {
      const item = this.itemSelectedInGrid();

      if (!item) return;

      if (item.element) {
        this.fields.set(this.getElementConfig(item.element.name));
        this.formValue.set(item.element.config);
        return;
      }

      const type = this.typeItem();
      const inspector = this.inspectors[type as Exclude<typeof type, 'element' | ''>];

      this.fields.set(inspector.fields);
      this.formValue.set(inspector.config(item) ?? {});
    });
  }

  /**
   * get element config
   * @param name
   * @returns
   */
  getElementConfig(name: string) {
    return this.elementTypes().get(name) ?? [];
  }

  updateItem(value: Record<string, unknown>) {
    const selected = this.itemSelectedInGrid();
    if (!selected) {
      return;
    }

    const type = this.typeItem();

    if (type === 'page') {
      const page = selected.page;
      if (!page) {
        return;
      }
      const newConfig = updateConfigPageElement(page, value);
      this._canvasService.configByType[selected.canvas].set(newConfig);
      this._canvasService.updateChangesPageConfigInCanvas(selected.canvas, newConfig.config);
      return;
    }

    const strategy = this.updateStrategies[type];
    const item = strategy.getItem(selected);
    if (!item) {
      return;
    }

    const sectionsInCanvas = this.currentSections;
    const previous = structuredClone(sectionsInCanvas);
    const newItem = { ...item, config: value } as any;
    const next = strategy.update(sectionsInCanvas, item.uuid, newItem);
    const current = structuredClone(next);
    this.currentSections = current;
    this._canvasService.updateChangesInCanvas(this.gridType(), previous, next);
  }

  /**
   * currentSections
   */
  private get currentSections(): SectionI[] {
    return this._canvasService.sectionsByType[this.gridType()].get();
  }

  /**
   * currentSections
   */
  private set currentSections(sections: SectionI[]) {
    this._canvasService.sectionsByType[this.gridType()].set(sections);
  }
}
