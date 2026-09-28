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
  StyleConfigI,
  DesignSectionT,
} from 'app/shared/interfaces/design.interface';
import {
  cssToJson,
  DEFAULT_STATES,
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
    mobile: { base: {}, states: {} },
    tablet: { base: {}, states: {} },
    desktop: { base: {}, states: {} },
  });
  designMode = signal<DesignModeT>('UI');
  designBreakpoint = signal<DeviceT>('mobile');
  stateElement = signal<StateElementT>('normal');

  cssControl: FormControl = new FormControl();
  initialized = signal<boolean>(false);

  private readonly _canvasService = inject(CanvasService);

  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

  readonly css = computed(
    () => this._canvasService.selectedItemsInGrid()?.[this.typeItem()]!.css ?? '',
  );
  readonly editorOptions = {
    theme: 'vs',
    language: 'css',
    minimap: { enabled: false },
  };
  readonly states: StateElementT[] = [
    'normal',
    ':hover',
    ':focus',
    ':active',
    ':disabled',
    ':visited',
  ];
  readonly cssByDevice = {
    mobile: {
      get: () => this.cssJson().mobile,
      set: (StyleConfig: StyleConfigI) => {
        this.cssJson.set({ ...this.cssJson(), mobile: { ...StyleConfig } });
      },
    },
    tablet: {
      get: () => this.cssJson().tablet,
      set: (StyleConfig: StyleConfigI) => {
        this.cssJson.set({ ...this.cssJson(), tablet: { ...StyleConfig } });
      },
    },
    desktop: {
      get: () => this.cssJson().desktop,
      set: (StyleConfig: StyleConfigI) => {
        this.cssJson.set({ ...this.cssJson(), desktop: { ...StyleConfig } });
      },
    },
  } satisfies Record<
    DeviceT,
    {
      get: () => StyleConfigI;
      set: (StyleConfig: StyleConfigI) => void;
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

  readonly layoutValue = signal<LayoutStylesI>({
    display: 'block',
    width: '100%',
    height: '400px',
  });
  readonly spacingValue = signal<SpacingStylesI>({
    margin: '0px',
    marginTop: '0px',
    marginRight: '0px',
    marginBottom: '0px',
    marginLeft: '0px',
    padding: '0px',
    paddingTop: '0px',
    paddingRight: '0px',
    paddingBottom: '0px',
    paddingLeft: '0px',
  });
  readonly typographyValue = signal<TypographyStylesI>({});
  readonly backgroundValue = signal<BackgroundStylesI>({});
  readonly borderValue = signal<BorderStylesI>({});
  readonly positionValue = signal<PositionStylesI>({
    position: 'relative',
  });
  readonly effectValue = signal<EffectsStylesI>({
    opacity: 1,
  });
  readonly overflowValue = signal<OverflowStylesI>({
    overflow: 'auto',
  });
  readonly interactionValue = signal<InteractionStylesI>({
    cursor: 'auto',
    pointerEvents: 'auto',
  });

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
  updateStyleConfig(properties: Record<string, string | number>, section: DesignSectionT) {
    const previousMobile = {
      base: {
        ...this.cssByDevice.mobile.get().base,
      },
      states: Object.fromEntries(
        Object.entries(this.cssByDevice.mobile.get().states).map(([state, styles]) => [
          state,
          { ...styles },
        ]),
      ),
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

    const styles: Record<string, string | number> = {
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

    const breakpoint = this.designBreakpoint();
    const currentStyles = this.cssByDevice[breakpoint].get();
    const currentState = this.stateElement();
    const styleConfig: StyleConfigI = {
      base: currentState === 'normal' ? { ...styles } : currentStyles.base,
      states:
        currentState === 'normal'
          ? {
              ...currentStyles.states,
              normal: { ...styles },
            }
          : {
              ...currentStyles.states,
              [currentState]: {
                ...styles,
              },
            },
    };

    this.cssByDevice[breakpoint].set(styleConfig);

    if (breakpoint === 'mobile') {
      const currentMobile = {
        base: {
          ...styleConfig.base,
        },
        states: Object.fromEntries(
          Object.entries(styleConfig.states).map(([state, styles]) => [state, { ...styles }]),
        ),
      };

      this.syncMobileChanges(previousMobile, currentMobile);
    }

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
    if (!this.initialized()) return;

    const stylesConfig = this.cssByDevice[this.designBreakpoint()].get();
    if (!stylesConfig) return;

    const styles =
      this.stateElement() === 'normal'
        ? stylesConfig.base
        : stylesConfig.states[this.stateElement()];

    this.layoutValue.set(splitStyles(styles, this.layoutValue()));
    this.spacingValue.set(splitStyles(styles, this.spacingValue()));
    this.typographyValue.set(splitStyles(styles, this.typographyValue()));
    this.backgroundValue.set(splitStyles(styles, this.backgroundValue()));
    this.borderValue.set(splitStyles(styles, this.borderValue()));
    this.positionValue.set(splitStyles(styles, this.positionValue()));
    this.effectValue.set(splitStyles(styles, this.effectValue()));
    this.overflowValue.set(splitStyles(styles, this.overflowValue()));
    this.interactionValue.set(splitStyles(styles, this.interactionValue()));
  }

  /**
   * Get initial values fot secctions
   * @param selector
   */
  getInitialValues(selector: string) {
    const styles: Record<string, string | number> = {
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

    const initialStyleConfig: StyleConfigI = {
      base: { ...styles },
      states: {
        ':hover': { ...styles },
        ':focus': { ...styles },
        ':active': { ...styles },
        ':disabled': { ...styles },
        ':visited': { ...styles },
      },
    };
    const initialCssJson: ResponsiveCssJsonI = {
      selector,
      mobile: structuredClone(initialStyleConfig),
      tablet: structuredClone(initialStyleConfig),
      desktop: structuredClone(initialStyleConfig),
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

    const mergedValues: ResponsiveCssJsonI = {
      ...defaultValues,
      selector,
      mobile: mergeStyleConfig(defaultValues.mobile, currentValues.mobile),
      tablet: mergeStyleConfig(defaultValues.tablet, currentValues.tablet),
      desktop: mergeStyleConfig(defaultValues.desktop, currentValues.desktop),
    };

    this.cssJson.set(mergedValues);
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

  /**
   * sync changes
   * @param previousMobile
   * @param currentMobile
   */
  private syncMobileChanges(previousMobile: StyleConfigI, currentMobile: StyleConfigI): void {
    const devices: Array<'tablet' | 'desktop'> = ['tablet', 'desktop'];
    const state = this.stateElement();

    for (const device of devices) {
      const currentConfig = this.cssByDevice[device].get();

      if (state === 'normal') {
        const newBase = {
          ...currentConfig.base,
        };

        for (const [property, newValue] of Object.entries(currentMobile.base)) {
          const previousValue = previousMobile.base[property];
          const currentValue = currentConfig.base[property];
          if (previousValue !== undefined && currentValue === previousValue) {
            newBase[property] = newValue;
          }
        }

        const newStates = {
          ...currentConfig.states,
        };

        for (const stateName of DEFAULT_STATES) {
          const currentState = {
            ...(currentConfig.states[stateName] ?? {}),
          };
          for (const [property, newValue] of Object.entries(currentMobile.base)) {
            const previousValue = previousMobile.base[property];
            const currentValue = currentState[property];
            if (previousValue !== undefined && currentValue === previousValue) {
              currentState[property] = newValue;
            }
          }
          newStates[stateName] = currentState;
        }

        this.cssByDevice[device].set({
          base: newBase,
          states: newStates,
        });
        continue;
      }

      const previousState = previousMobile.states[state] ?? {};
      const currentState = currentMobile.states[state] ?? {};
      const newStates = {
        ...currentConfig.states,
      };

      const targetState = {
        ...(currentConfig.states[state] ?? {}),
      };

      for (const [property, newValue] of Object.entries(currentState)) {
        const previousValue = previousState[property];
        const currentValue = targetState[property];
        if (previousValue !== undefined && currentValue === previousValue) {
          targetState[property] = newValue;
        }
      }

      newStates[state] = targetState;
      this.cssByDevice[device].set({
        ...currentConfig,
        states: newStates,
      });
    }
  }
}
