import { Component, signal, inject, effect, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ElementService } from 'app/core/services/element.service';
import { PageService } from 'app/core/services/pages.service';
import { LanguageService } from 'app/shared/services/language.service';
import { CanvasService } from 'app/core/services/canvas.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { TemplateService } from 'app/core/services/templates.service';
import { ElementI, SectionI } from 'app/shared/interfaces/grid.interface';
import { TabI } from 'app/shared/interfaces/drawer.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { deleteColumn, deleteElement, deleteRow } from 'app/shared/utils/grid.utils';
import { PermissionComponent } from '../permission/permission';
import { LangugesInspectorComponent } from './languages-inspector/languages-inspector';
import { PropertiesInspectorComponent } from './properties-inspector/properties-inspector';
import { DesignInspectorComponent } from './design-inspector/design-inspector';

@Component({
  selector: 'inspector-component',
  templateUrl: './inspector.html',
  imports: [
    NgClass,
    TooltipDirective,
    LangugesInspectorComponent,
    PermissionComponent,
    PropertiesInspectorComponent,
    DesignInspectorComponent,
  ],
})
export class InspectorComponent {
  gridType = input<CanvasT>('page');

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
      title: 'Propiedades',
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

  private readonly _elementService = inject(ElementService);
  private readonly _pageService = inject(PageService);
  private readonly _languageService = inject(LanguageService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _templateService = inject(TemplateService);

  readonly page = toSignal(this._pageService.page$, { initialValue: null });
  readonly template = toSignal(this._templateService.template$, { initialValue: null });
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

  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

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

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const selectedItemsInGrid = this.selectedItemsInGrid();
      if (selectedItemsInGrid) return;
      this.selectedTab.set(0);
      this.sectionsInCanvas.set(this.currentSections);
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
    this._canvasService.selectedItemsInGrid.set({
      page: null,
      section: null,
      row: null,
      column: null,
      element: null,
      canvas: this.gridType(),
    });
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
   * Color for icons
   * @returns
   */
  itemIconBackgroundClass(): string {
    if (this.isEmpty()) {
      return 'bg-indigo-100';
    }

    return (
      {
        page: 'bg-gray-100',
        section: 'bg-indigo-100',
        row: 'bg-amber-100',
        column: 'bg-slate-100',
        element: 'bg-emerald-100',
      }[this.typeItem()] ?? 'bg-slate-100'
    );
  }

  /**
   * Icon for type
   * @returns
   */
  itemIconClass(): string {
    if (this.isEmpty()) {
      return 'fa-solid fa-sliders text-gray-600';
    }

    const icons: Record<string, string> = {
      page: `fa-solid text-gray-600  ${
        this.gridType() === 'page'
          ? 'fa-table-cells'
          : this.gridType() === 'header'
            ? 'fa-table'
            : 'fa-table rotate-180'
      }`,
      section: 'fa-solid fa-object-group text-indigo-600',
      row: 'fa-solid fa-table-list text-amber-600',
      column: 'fa-solid fa-table-columns text-slate-600',
    };

    if (this.typeItem() === 'element') {
      return `${this.getElementIcon(this.selectedItemsInGrid()!.element!)} text-emerald-600`;
    }

    return icons[this.typeItem()] ?? 'fa-solid fa-cube text-slate-600';
  }

  /**
   * Title
   * @returns
   */
  itemTitle(): string {
    if (this.isEmpty()) {
      return 'Inspector de Propiedades';
    }

    switch (this.typeItem()) {
      case 'page':
        return this.gridType() === 'page'
          ? 'Contenido Principal'
          : this.gridType() === 'header'
            ? 'Encabezado'
            : 'Pie de página';
      case 'section':
        return 'Sección';
      case 'row':
        return 'Fila';
      case 'column':
        return 'Columna';
      case 'element':
        return `Elemento ${this.selectedItemsInGrid()?.element?.name ?? ''}`;
      default:
        return '';
    }
  }

  /**
   * Get uuid
   * @returns
   */
  itemUuid(): string {
    if (this.isEmpty()) {
      return '';
    }

    const selected = this.selectedItemsInGrid();
    switch (this.typeItem()) {
      case 'section':
        return selected?.section?.uuid ?? '';
      case 'row':
        return selected?.row?.uuid ?? '';
      case 'column':
        return selected?.column?.uuid ?? '';
      case 'element':
        return selected?.element?.uuid ?? '';
      default:
        return '';
    }
  }

  /**
   * Text for delete
   * @returns
   */
  deleteItemLabel(): string {
    return (
      {
        section: 'Sección',
        row: 'Fila',
        column: 'Columna',
        element: 'Elemento',
        page: '',
      }[this.typeItem()] ?? ''
    );
  }

  /**
   * can edit design
   */
  canEditDesign(): boolean {
    return (
      this.validPermission(this.permission.editDesignTemplate) ||
      this.validPermission(this.permission.editDesignPage)
    );
  }

  /**
   * can edit content
   * @returns
   */
  canEditContent(): boolean {
    return (
      this.validPermission(this.permission.editContentPage) ||
      this.validPermission(this.permission.editContentTemplate)
    );
  }

  /**
   * mutate grid
   * @param next
   */
  private updateCanvas(newSections: SectionI[]) {
    const previous = structuredClone(this.sectionsInCanvas());
    this.currentSections = newSections;
    const next = structuredClone(this.currentSections);
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
