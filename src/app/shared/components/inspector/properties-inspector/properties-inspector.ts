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
import { HistoryService } from 'app/core/services/history-canvas.service';
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
  private readonly _historyService = inject(HistoryService);

  readonly pageSections = this._pageService.sections;
  readonly headerSections = this._pageService.sectionsHeader;
  readonly footerSections = this._pageService.sectionsFooter;

  readonly elements = toSignal(this._elementService.elements$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });
  readonly page = toSignal(this._pageService.page$, { initialValue: null });

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

  readonly sectionsByType = {
    header: {
      get: () => this.headerSections(),
      set: (sections: SectionI[]) => {
        this._pageService.sectionsHeader = sections;
      },
    },
    body: {
      get: () => this.pageSections(),
      set: (sections: SectionI[]) => {
        this._pageService.sections = sections;
      },
    },
    footer: {
      get: () => this.footerSections(),
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

  /**
   * Update secctions in canvas grid
   * @param next
   */
  updateSectionsInGrid(previous: SectionI[], current: SectionI[]) {
    const next = structuredClone(current);
    this.currentSections = next;
    this._historyService.commit(this.gridType(), previous, structuredClone(this.currentSections));
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

      page.config = value;
      const newConfig = updateConfigPageElement(page, value);

      const curretPage = this.page();
      if (!curretPage) return;
      const newPage = structuredClone({
        ...curretPage,
        data: {
          ...curretPage.data,
          body: {
            ...curretPage.data?.body!,
            config: newConfig.config,
          },
        },
      });
      this._pageService.page = newPage;

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
    this.updateSectionsInGrid(previous, next);
  }

  /**
   * currentSections
   */
  private get currentSections(): SectionI[] {
    return this.sectionsByType[this.gridType()].get();
  }

  /**
   * currentSections
   */
  private set currentSections(sections: SectionI[]) {
    this.sectionsByType[this.gridType()].set(sections);
  }
}
