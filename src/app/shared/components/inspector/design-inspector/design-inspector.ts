import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { NgClass, TitleCasePipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { CanvasService } from 'app/core/services/canvas.service';
import { SectionI, SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import {
  ResponsiveCssJsonI,
  DesignModeT,
  DeviceT,
  StateElementT,
  LayoutStylesI,
  SpacingStylesI,
  TypographyStylesI,
  BackgroundStylesI,
  BorderStylesI,
  PositionStylesI,
  EffectsStylesI,
  OverflowStylesI,
  InteractionStylesI,
  DesignSectionT,
} from 'app/shared/interfaces/design.interface';
import {
  cssToJson,
  defaultBackgroundStyles,
  defaultBorderStyles,
  defaultEffetsStyles,
  defaultInteractionStyles,
  defaultLayoutStyles,
  defaultOverflowStyles,
  defaultPositionStyles,
  defaultSpacingStyles,
  defaultTypographyStyles,
  jsonToCss,
  mergeStyleConfig,
  parseRule,
  splitStyles,
  updateColumn,
  updateCssPageElement,
  updateElement,
  updateRow,
  updateSection,
} from 'app/shared/utils/grid.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { DesignLayoutComponent } from 'app/shared/components/dynamic-form/layout/layout';
import { DesignSpacingComponent } from 'app/shared/components/dynamic-form/spacing/spacing';
import { DesignTypographyComponent } from 'app/shared/components/dynamic-form/typography/typography';
import { DesignBackgroundComponent } from 'app/shared/components/dynamic-form/background/background';
import { DesignBorderComponent } from 'app/shared/components/dynamic-form/border/border';
import { DesignPositionComponent } from 'app/shared/components/dynamic-form/position/position';
import { DesignEffectsComponent } from 'app/shared/components/dynamic-form/effect/effect';
import { DesignOverflowComponent } from 'app/shared/components/dynamic-form/overflow/overflow';
import { DesignInteractionComponent } from 'app/shared/components/dynamic-form/interaction/interaction';

@Component({
  selector: 'design-inspector-component',
  templateUrl: './design-inspector.html',
  imports: [
    FormsModule,
    EditorComponent,
    TooltipDirective,
    ReactiveFormsModule,
    NgClass,
    TitleCasePipe,
    DesignLayoutComponent,
    DesignSpacingComponent,
    DesignTypographyComponent,
    DesignBackgroundComponent,
    DesignBorderComponent,
    DesignPositionComponent,
    DesignPositionComponent,
    DesignEffectsComponent,
    DesignOverflowComponent,
    DesignInteractionComponent,
  ],
})
export class DesignInspectorComponent {
  gridType = input.required<CanvasT>();

  cssJson = signal<ResponsiveCssJsonI>({
    selector: '',
    mobile: {},
    tablet: {},
    desktop: {},
    states: {},
  });
  designMode = signal<DesignModeT>('UI');
  designBreakpoint = signal<DeviceT>('mobile');
  stateElement = signal<StateElementT>('normal');

  cssControl: FormControl = new FormControl();
  initialized = signal<boolean>(false);

  private readonly _canvasService = inject(CanvasService);

  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

  readonly cssByDevice = {
    mobile: {
      get: () => this.cssJson().mobile,
      set: (StyleConfig: Record<string, string>) => {
        this.cssJson.set({ ...this.cssJson(), mobile: { ...StyleConfig } });
      },
    },
    tablet: {
      get: () => this.cssJson().tablet,
      set: (StyleConfig: Record<string, string>) => {
        this.cssJson.set({ ...this.cssJson(), tablet: { ...StyleConfig } });
      },
    },
    desktop: {
      get: () => this.cssJson().desktop,
      set: (StyleConfig: Record<string, string>) => {
        this.cssJson.set({ ...this.cssJson(), desktop: { ...StyleConfig } });
      },
    },
  } satisfies Record<
    DeviceT,
    {
      get: () => Record<string, string>;
      set: (StyleConfig: Record<string, string>) => void;
    }
  >;
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
  readonly editorOptions = {
    theme: 'vs',
    language: 'css',
    minimap: { enabled: false },
  };

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
  readonly currentStates = computed(() => {
    const states = Object.keys(this.cssJson().states);
    return ['normal', ...states] as StateElementT[];
  });
  readonly css = computed(
    () => this._canvasService.selectedItemsInGrid()?.[this.typeItem()]!.css ?? '',
  );
  readonly states = computed(() => {
    const states: StateElementT[] = [':hover', ':focus', ':active', ':disabled', ':visited'];
    return states.filter((x) => !this.currentStates().includes(x));
  });

  readonly layoutValue = signal<LayoutStylesI>(defaultLayoutStyles);
  readonly spacingValue = signal<SpacingStylesI>(defaultSpacingStyles);
  readonly typographyValue = signal<TypographyStylesI>(defaultTypographyStyles);
  readonly backgroundValue = signal<BackgroundStylesI>(defaultBackgroundStyles);
  readonly borderValue = signal<BorderStylesI>(defaultBorderStyles);
  readonly positionValue = signal<PositionStylesI>(defaultPositionStyles);
  readonly effectValue = signal<EffectsStylesI>(defaultEffetsStyles);
  readonly overflowValue = signal<OverflowStylesI>(defaultOverflowStyles);
  readonly interactionValue = signal<InteractionStylesI>(defaultInteractionStyles);

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      this.selectedItemsInGrid();
      const css = this.css();

      if (!css) return;
      const parseRuleValue = parseRule(css);
      if (!parseRuleValue) return;

      untracked(() => {
        if (parseRuleValue?.body === '') {
          this.getInitialValues(parseRuleValue.selector);
        } else {
          this.getPreviousValues(css, parseRuleValue.selector!);
        }
        this.cssControl.setValue(jsonToCss(this.cssJson()), { emitEvent: false });
        this.initialized.set(true);
      });
    });
  }

  /**
   * toggle mode design
   * @param mode
   */
  toggleDesignMode(mode: DesignModeT) {
    if (mode === 'CODE') {
      const css = jsonToCss(this.cssJson());
      this.cssControl.setValue(css);
    } else {
      const jsonCss = cssToJson(this.cssControl.value);
      this.cssJson.set(jsonCss);
    }
    this.designMode.set(mode);
  }

  /**
   * toggle design breakpoint
   * @param mode
   */
  toggleDesignBreakpoint(device: DeviceT) {
    this.designBreakpoint.set(device);
    this.getCurrentBreakPointValues();
  }

  /**
   * toggle design state
   * @param mode
   */
  toggleDesignSate(state: StateElementT) {
    this.stateElement.set(state);
    this.getCurrentBreakPointValues();
  }

  /**
   * Update styles
   * @param properties
   * @param section
   */
  updateStyleConfig(properties: Record<string, string>, section: DesignSectionT) {
    const previousStylesMobile = {
      ...this.cssByDevice.mobile.get(),
    };

    switch (section) {
      case 'layout':
        this.layoutValue.set(properties as unknown as LayoutStylesI);
        break;
      case 'background':
        this.backgroundValue.set(properties as unknown as BackgroundStylesI);
        break;
      case 'typography':
        this.typographyValue.set(properties as unknown as TypographyStylesI);
        break;
      case 'position':
        this.positionValue.set(properties as unknown as PositionStylesI);
        break;
      case 'border':
        this.borderValue.set(properties as unknown as BorderStylesI);
        break;
      case 'spacing':
        this.spacingValue.set(properties as unknown as SpacingStylesI);
        break;
      case 'interaction':
        this.interactionValue.set(properties as unknown as InteractionStylesI);
        break;
      case 'effect':
        this.effectValue.set(properties as unknown as EffectsStylesI);
        break;
      case 'overflow':
        this.overflowValue.set(properties as unknown as OverflowStylesI);
        break;
    }

    const styles: Record<string, string> = {
      ...this.layoutValue(),
      ...this.spacingValue(),
      ...this.typographyValue(),
      ...this.backgroundValue(),
      ...this.borderValue(),
      ...this.positionValue(),
      ...this.effectValue(),
      ...this.overflowValue(),
      ...this.interactionValue(),
      ...properties,
    };

    if (this.stateElement() !== 'normal') {
      this.updateStyleStatesConfig(styles);
      return;
    }

    const breakpoint = this.designBreakpoint();
    const nextStylesMobile: Record<string, string> = {
      ...styles,
    };

    this.cssByDevice[breakpoint].set(nextStylesMobile);

    if (breakpoint === 'mobile') {
      this.syncMobile(previousStylesMobile, nextStylesMobile);
    }

    const css = jsonToCss(this.cssJson());
    this.updateItem(css);
  }

  /**
   * Update states
   * @param styles
   */
  updateStyleStatesConfig(styles: Record<string, string>) {
    this.cssJson.update((prev) => {
      return {
        ...prev,
        states: {
          ...prev.states,
          [`${this.stateElement()}`]: { ...styles },
        },
      };
    });

    const css = jsonToCss(this.cssJson());
    this.updateItem(css);
  }

  /**
   * Update item
   * @param value
   * @returns
   */
  updateItem(value: string) {
    if (!this.initialized()) return;

    const selected = this.selectedItemsInGrid();
    if (!selected) {
      return;
    }

    const type = this.typeItem();

    if (type === 'page') {
      const page = selected.page;
      if (!page) {
        return;
      }
      const newConfig = updateCssPageElement(page, value);
      this._canvasService.configByType[selected.canvas].set(newConfig);
      this._canvasService.updateChangesPageCssInCanvas(selected.canvas, newConfig.css);
      return;
    }

    const strategy = this.updateStrategies[type];
    const item = strategy.getItem(selected);
    if (!item) {
      return;
    }

    const sectionsInCanvas = this.currentSections;
    const previous = structuredClone(sectionsInCanvas);
    const newItem = { ...item, css: value } as any;

    const next = strategy.update(sectionsInCanvas, item.uuid, newItem);
    const current = structuredClone(next);
    this.currentSections = current;
    this._canvasService.updateChangesInCanvas(this.gridType(), previous, next);
  }

  /**
   * Get values fot secctions
   */
  getCurrentBreakPointValues() {
    const stylesConfig = this.cssByDevice[this.designBreakpoint()].get();
    if (!stylesConfig) return;

    const styles =
      this.stateElement() === 'normal' ? stylesConfig : this.cssJson().states[this.stateElement()]!;

    this.layoutValue.set(splitStyles(styles, defaultLayoutStyles));
    this.spacingValue.set(splitStyles(styles, defaultSpacingStyles));
    this.typographyValue.set(splitStyles(styles, defaultTypographyStyles));
    this.backgroundValue.set(splitStyles(styles, defaultBackgroundStyles));
    this.borderValue.set(splitStyles(styles, defaultBorderStyles));
    this.positionValue.set(splitStyles(styles, defaultPositionStyles));
    this.effectValue.set(splitStyles(styles, defaultEffetsStyles));
    this.overflowValue.set(splitStyles(styles, defaultOverflowStyles));
    this.interactionValue.set(splitStyles(styles, defaultInteractionStyles));
  }

  /**
   * Get initial values fot secctions
   * @param selector
   */
  getInitialValues(selector: string) {
    const styles: Record<string, string> = {
      ...this.layoutValue(),
      ...this.spacingValue(),
      ...this.typographyValue(),
      ...this.backgroundValue(),
      ...this.borderValue(),
      ...this.positionValue(),
      ...this.effectValue(),
      ...this.overflowValue(),
      ...this.interactionValue(),
    };

    const initialStyleConfig: Record<string, string> = {
      ...styles,
    };

    const initialCssJson: ResponsiveCssJsonI = {
      selector,
      mobile: structuredClone(initialStyleConfig),
      tablet: structuredClone(initialStyleConfig),
      desktop: structuredClone(initialStyleConfig),
      states: {},
    };

    this.cssJson.set(initialCssJson);
  }

  /**
   * Get styles previous
   * @param css
   * @param selector
   */
  getPreviousValues(css: string, selector: string) {
    this.getInitialValues(selector);
    const defaultValues = this.cssJson();
    const currentValues = cssToJson(css);    

    const mergeStylesMobile = mergeStyleConfig(defaultValues.mobile, currentValues.mobile);
    const mergeStylesTablet = mergeStyleConfig(defaultValues.tablet, currentValues.tablet);
    const mergeStylesDesktop = mergeStyleConfig(defaultValues.desktop, currentValues.desktop);

    const mergedValues: ResponsiveCssJsonI = {
      selector,
      mobile: {
        ...mergeStylesMobile,
      },
      tablet:
        Object.keys(currentValues.tablet).length === 0 ? mergeStylesMobile : mergeStylesTablet,
      desktop:
        Object.keys(currentValues.desktop).length === 0 ? mergeStylesMobile : mergeStylesDesktop,
      states: { ...currentValues.states },
    };



    this.cssJson.set(mergedValues);
    this.getCurrentBreakPointValues();
  }

  /**
   * Add state
   * @param state
   */
  addState(state: string) {
    this.cssJson.update((prev) => {
      return {
        ...prev,
        states: {
          ...prev.states,
          [`${state}`]: { ...prev.mobile },
        },
      };
    });
    this.stateElement.set(state as StateElementT);
    this.getCurrentBreakPointValues();
    const css = jsonToCss(this.cssJson());
    this.updateItem(css);
  }

  /**
   * Remove state
   * @param state
   */
  removeState(state: StateElementT) {
    this.stateElement.set('normal');
    this.getCurrentBreakPointValues();
    this.cssJson.update((prev) => {
      return {
        ...prev,
        states: {
          ...Object.fromEntries(
            Object.entries(prev.states ?? {}).filter(([stateKey]) => stateKey !== state),
          ),
        },
      };
    });
    const css = jsonToCss(this.cssJson());
    this.updateItem(css);
  }

  /**
   * Sync changes in mobile
   * @param responsive
   * @returns
   */
  syncMobile(
    previousStylesMobile: Record<string, string>,
    nextStylesMobile: Record<string, string>,
  ) {
    const mobile = { ...nextStylesMobile };

    const tablet = this.cssByDevice['tablet'].get();
    for (const [key, value] of Object.entries(tablet)) {
      if (tablet[key] === previousStylesMobile[key]) {
        tablet[key] = nextStylesMobile[key];
      } else {
        tablet[key] = value;
      }
    }

    const desktop = this.cssByDevice['desktop'].get();
    for (const [key, value] of Object.entries(desktop)) {
      if (desktop[key] === previousStylesMobile[key]) {
        desktop[key] = nextStylesMobile[key];
      } else {
        desktop[key] = value;
      }
    }

    this.cssJson.update((prev) => {
      return {
        ...prev,
        mobile,
        tablet,
        desktop,
      };
    });
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
