import {
  Component,
  OnInit,
  signal,
  inject,
  OnDestroy,
  effect,
  computed,
  input,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ElementI, SectionI, SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';
import { ElementService } from 'app/core/services/element.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageService } from 'app/core/services/pages.service';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { LanguageService } from 'app/shared/services/language.service';
import { TabI } from 'app/shared/interfaces/drawer.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import { ParameterService } from 'app/core/services/parameter.service';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionComponent } from '../permission/permission';
import { LangugesInspectorComponent } from '../languages-inspector/languages-inspector';
import { deleteColumn, deleteElement, deleteRow } from 'app/shared/utils/grid.utils';
import { PropertiesInspectorComponent } from '../properties-inspector/properties-inspector';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { distinctUntilChanged, Subject, takeUntil } from 'rxjs';

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
export class InspectorComponent implements OnInit, OnDestroy {
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
  urlStatics = signal<string>('');
  inspectorCollapsed = signal<boolean>(false);

  permission = PermissionCode;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _elementService = inject(ElementService);
  private readonly _pageService = inject(PageService);
  private readonly _languageService = inject(LanguageService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _historyService = inject(HistoryService);

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

  isEmpty = computed(() => {
    const selectedItem = this.selectedItemsInGrid();
    if (selectedItem === null) return true;
    return (
      selectedItem?.section === null &&
      selectedItem?.column === null &&
      selectedItem.row === null &&
      selectedItem.element === null
    );
  });

  typeItem = computed(() => {
    const selectedItem = this.selectedItemsInGrid();

    if (!selectedItem) {
      return 'page';
    }

    if (selectedItem.element !== null) return 'element';
    if (selectedItem.column !== null) return 'column';
    if (selectedItem.row !== null) return 'row';
    if (selectedItem.section !== null) return 'section';

    return 'page';
  });

  dataTextLanguages = computed(() => {
    const selectedItem = this.selectedItemsInGrid();
    if (!selectedItem) {
      return null;
    }
    if (selectedItem?.element !== null) return selectedItem.element.dataText;
    return null;
  });

  textLanguages = computed(() => {
    const selectedItem = this.selectedItemsInGrid();
    if (!selectedItem) {
      return null;
    }
    if (selectedItem?.element !== null) return selectedItem.element.text;
    return null;
  });

  tabsComputed = computed(() => {
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
      const selectedItem = this.selectedItemsInGrid();
      this.selectTab(0);
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

    effect(() => {
      const parameters = this.parameters();
      const parameter = findParameter('APP_STATICS_URL', parameters);
      if (parameter) {
        this.urlStatics.set(parameter.value);
      }
    });

    this._pageService.selectedItemsInGrid$
      .pipe(distinctUntilChanged(), takeUntil(this._unsubscribeAll))
      .subscribe({
        next: (selectedItemsInGrid) => {
          this.selectedItemsInGrid.set(selectedItemsInGrid);
          switch (selectedItemsInGrid?.canvas) {
            case 'header':
              this.sectionsInCanvas.set(this._pageService.sectionsHeader());
              break;
            case 'body':
              this.sectionsInCanvas.set(this._pageService.sections());
              break;
            case 'footer':
              this.sectionsInCanvas.set(this._pageService.sectionsFooter());
              break;
          }
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
      section: null,
      row: null,
      column: null,
      element: null,
      canvas: this.gridType(),
    };
  }

  /**
   * Update secctions in canvas grid
   * @param previous
   * @param next
   */
  updateSectionsInGrid(previous: SectionI[], next: SectionI[]) {
    if (this.gridType() === 'header') {
      this._pageService.sectionsHeader = next;
      this._historyService.commit(this.gridType(), previous, next);
    }
    if (this.gridType() === 'footer') {
      this._pageService.sectionsFooter = next;
      this._historyService.commit(this.gridType(), previous, next);
    }
    if (this.gridType() === 'body') {
      this._pageService.sections = next;
      this._historyService.commit(this.gridType(), previous, next);
    }
  }

  /**
   * Delete section to grid
   * @param uuid
   */
  deleteSection(uuid: string) {
    const previous = structuredClone(this.sectionsInCanvas());
    const grid = this.sectionsInCanvas().filter((item) => item.uuid !== uuid);
    const next = structuredClone(grid);
    this.updateSectionsInGrid(previous, next);
  }

  /**
   * Delete row to section
   * @param uuid
   */
  deleteRow(uuid: string) {
    const previous = structuredClone(this.sectionsInCanvas());
    const grid = deleteRow(this.sectionsInCanvas(), uuid);
    const next = structuredClone(grid);
    this.updateSectionsInGrid(previous, next);
  }

  /**
   * Delete column to row
   * @param uuid
   */
  deleteColumn(uuid: string) {
    const previous = structuredClone(this.sectionsInCanvas());
    const grid = deleteColumn(this.sectionsInCanvas(), uuid);
    const next = structuredClone(grid);
    this.updateSectionsInGrid(previous, next);
  }

  /**
   * Delete element to column
   * @param uuid
   */
  deleteElement(uuid: string) {
    const previous = structuredClone(this.sectionsInCanvas());
    const grid = deleteElement(this.sectionsInCanvas(), uuid);
    const next = structuredClone(grid);
    this.updateSectionsInGrid(previous, next);
  }

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
}
