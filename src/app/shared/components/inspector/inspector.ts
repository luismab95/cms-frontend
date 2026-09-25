import { Component, signal, inject, effect, computed, input, DestroyRef } from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ElementService } from 'app/core/services/element.service';
import { PageService } from 'app/core/services/pages.service';
import { LanguageService } from 'app/shared/services/language.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { ElementI, SectionI, SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';
import { TabI } from 'app/shared/interfaces/drawer.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionComponent } from '../permission/permission';
import { LangugesInspectorComponent } from './languages-inspector/languages-inspector';
import { deleteColumn, deleteElement, deleteRow } from 'app/shared/utils/grid.utils';
import { PropertiesInspectorComponent } from './properties-inspector/properties-inspector';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'inspector-component',
  templateUrl: './inspector.html',
  imports: [
    NgClass,
    TooltipDirective,
    LangugesInspectorComponent,
    PermissionComponent,
    PropertiesInspectorComponent,
  ],
})
export class InspectorComponent {
  gridType = input.required<CanvasT>();

  selectedItemsInGrid = signal<SelectedItemsInGridI | null>(null);
  tabsLanguages = signal<TabI[]>([]);
  tabs = signal<TabI[]>([
    {
      id: 0,
      title: 'Diseño',
      description: 'Personaliza la apariencia y el estilo.',
      icon: 'fa-solid fa-palette',
      type: 'icon',
    },
    {
      id: 1,
      title: 'Configuración',
      description: 'Configura el comportamiento y las opciones.',
      icon: 'fa-solid fa-sliders',
      type: 'icon',
    },
    {
      id: 2,
      title: 'Idiomas',
      description: 'Gestiona las traducciones en diferentes idiomas.',
      icon: 'fa-solid fa-language',
      type: 'icon',
    },
  ]);
  sectionsInCanvas = signal<SectionI[]>([]);
  selectedTab = signal<number>(0);
  selectedLanguage = signal<number>(0);
  inspectorCollapsed = signal<boolean>(false);

  permission = PermissionCode;

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _elementService = inject(ElementService);
  private readonly _pageService = inject(PageService);
  private readonly _languageService = inject(LanguageService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _historyService = inject(HistoryService);

  readonly sectionsPageInCanvas = this._pageService.sections;
  readonly sectionsHeaderInCanvas = this._pageService.sectionsHeader;
  readonly sectionsFooterInCanvas = this._pageService.sectionsFooter;

  readonly languages = toSignal(this._languageService.languages$, {
    initialValue: {
      records: [],
      total: 0,
      page: 0,
      totalPage: 0,
    },
  });
  readonly elements = toSignal(this._elementService.elements$, {
    initialValue: {
      records: [],
      total: 0,
      page: 0,
      totalPage: 0,
    },
  });
  readonly parameters = toSignal(this._parameterService.parameter$, {
    initialValue: [],
  });

  readonly urlStatics = computed(
    () => findParameter('APP_STATICS_URL', this.parameters())?.value ?? '',
  );
  readonly isEmpty = computed(() => {
    const selectedItem = this.selectedItemsInGrid();
    if (selectedItem === null) return true;
    return (
      selectedItem.page === null &&
      selectedItem.section === null &&
      selectedItem.column === null &&
      selectedItem.row === null &&
      selectedItem.element === null
    );
  });
  readonly typeItem = computed(() => {
    const item = this.selectedItemsInGrid();
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
  readonly selectedElement = computed(() => this.selectedItemsInGrid()?.element);
  readonly dataTextLanguages = computed(() => this.selectedElement()?.dataText ?? null);
  readonly textLanguages = computed(() => this.selectedElement()?.text ?? null);
  readonly tabsComputed = computed(() => {
    const selectedItem = this.selectedItemsInGrid();
    const tabs = this.tabs().filter((tab) => tab.id !== 2);
    if (selectedItem?.element !== null) {
      tabs.push({
        id: 2,
        title: 'Idiomas',
        description: 'Gestiona las traducciones en diferentes idiomas.',
        icon: 'fa-solid fa-language',
        type: 'icon',
      });
    }

    return tabs;
  });

  readonly sectionsByType = {
    header: {
      get: () => this.sectionsHeaderInCanvas(),
      set: (sections: SectionI[]) => {
        this._pageService.sectionsHeader = sections;
      },
    },
    body: {
      get: () => this.sectionsPageInCanvas(),
      set: (sections: SectionI[]) => {
        this._pageService.sections = sections;
      },
    },
    footer: {
      get: () => this.sectionsFooterInCanvas(),
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
      const selectedItemsInGrid = this.selectedItemsInGrid();
      if (selectedItemsInGrid) {
        this.selectedTab.set(0);
      }
    });

    effect(() => {
      const languages = this.languages().records;
      if (!languages.length) {
        return;
      }

      if (this.selectedLanguage() >= languages.length) {
        this.selectedLanguage.set(0);
      }

      const tabs: TabI[] = languages.map(
        (lang) =>
          ({
            id: lang.id,
            icon: this.getICon(lang.icon),
            type: 'image',
            title: lang.lang.toUpperCase(),
            description: lang.lang,
          }) as TabI,
      );

      this.tabsLanguages.set(tabs);
    });

    this._pageService.selectedItemsInGrid$
      .pipe(distinctUntilChanged(), takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (selectedItemsInGrid) => {
          this.selectedItemsInGrid.set(selectedItemsInGrid);
          this.sectionsInCanvas.set(this.currentSections);
        },
      });
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
   * select tab
   * @param id
   */
  selectTab(id: number) {
    this.selectedTab.set(id);
  }

  /**
   * Selecciona un idioma por su INDEX.
   */
  selectLanguage(index: number): void {
    this.selectedLanguage.set(index);
  }

  /**
   * URL del icono
   */
  getICon(icon: string): string {
    return `${this.urlStatics()}/${icon}`;
  }

  /**
   * Valid render permission
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   * Delete Item
   */
  deleteItem() {
    switch (this.typeItem()) {
      case 'section':
        this.deleteSection(this.selectedItemsInGrid()?.section?.uuid!);
        break;
      case 'row':
        this.deleteRow(this.selectedItemsInGrid()?.row?.uuid!);
        break;
      case 'column':
        this.deleteColumn(this.selectedItemsInGrid()?.column?.uuid!);
        break;
      case 'element':
        this.deleteElement(this.selectedItemsInGrid()?.element?.uuid!);
        break;
    }

    this.resetSelectedItem();
  }

  /**
   * Reset selected item
   */
  resetSelectedItem() {
    this._pageService.selectedItemsInGrid = {
      page: null,
      section: null,
      row: null,
      column: null,
      element: null,
      canvas: this.gridType(),
    };
  }

  /**
   * Delete section to grid
   * @param uuid
   */
  deleteSection(uuid: string) {
    const grid = this.sectionsInCanvas().filter((item) => item.uuid !== uuid);
    this.updateCanvas(grid);
  }

  /**
   * Delete row to section
   * @param uuid
   */
  deleteRow(uuid: string) {
    const grid = deleteRow(this.sectionsInCanvas(), uuid);
    this.updateCanvas(grid);
  }

  /**
   * Delete column to row
   * @param uuid
   */
  deleteColumn(uuid: string) {
    const grid = deleteColumn(this.sectionsInCanvas(), uuid);
    this.updateCanvas(grid);
  }

  /**
   * Delete element to column
   * @param uuid
   */
  deleteElement(uuid: string) {
    const grid = deleteElement(this.sectionsInCanvas(), uuid);
    this.updateCanvas(grid);
  }

  /**
   * Toggle inspector
   */
  toggleInspector(): void {
    this.inspectorCollapsed.update((collapsed) => !collapsed);
  }

  /**
   * open panel
   */
  openInspector(): void {
    this.inspectorCollapsed.set(true);
  }

  /**
   * close panel
   */
  closeInspector(): void {
    this.inspectorCollapsed.set(false);
  }

  /**
   * mutate grid
   * @param next
   */
  private updateCanvas(newSections: SectionI[]) {
    const previous = structuredClone(this.sectionsInCanvas());
    this.currentSections = newSections;
    const next = structuredClone(this.currentSections);
    this._historyService.commit(this.gridType(), previous, next);
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
