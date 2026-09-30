import { RegisteredFieldTypes } from '@ng-forge/dynamic-forms';
import {
  ColumnI,
  ElementI,
  PageElementsConfigI,
  RowI,
  SectionI,
} from '../interfaces/grid.interface';
import { generateRandomString } from './random.utils';
import { ElementCMSI } from '../interfaces/element.interface';
import * as csstree from 'css-tree';
import { PositionStylesI } from '../interfaces/design.interface';
import {
  BackgroundStylesI,
  BorderStylesI,
  EffectsStylesI,
  InteractionStylesI,
  OverflowStylesI,
} from '../interfaces/design.interface';
import {
  ResponsiveCssJsonI,
  DeviceT,
  LayoutStylesI,
  SpacingStylesI,
  TypographyStylesI,
} from '../interfaces/design.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import type { StyleSheet } from 'css-tree';

export function validGrid(data: SectionI[]): boolean {
  if (!data.length) {
    return false;
  }

  let hasElement = false;
  for (const section of data) {
    if (!section.rows.length) {
      return false;
    }
    for (const row of section.rows) {
      if (!row.columns.length) {
        return false;
      }
      for (const column of row.columns) {
        if (column.element) {
          hasElement = true;
        }
      }
    }
  }

  return hasElement;
}

export function updateSection(
  sections: SectionI[],
  sectionUuid: string,
  updatedSection: SectionI,
): SectionI[] {
  return sections.map((section) => (section.uuid === sectionUuid ? updatedSection : section));
}

export function updateRow(sections: SectionI[], rowUuid: string, updatedRow: RowI): SectionI[] {
  return sections.map((section) => ({
    ...section,
    rows: section.rows.map((row) => (row.uuid === rowUuid ? updatedRow : row)),
  }));
}

export function updateColumn(
  sections: SectionI[],
  columnUuid: string,
  updatedColumn: ColumnI,
): SectionI[] {
  return sections.map((section) => ({
    ...section,
    rows: section.rows.map((row) => ({
      ...row,
      columns: row.columns.map((column) => (column.uuid === columnUuid ? updatedColumn : column)),
    })),
  }));
}

export function updateElement(
  sections: SectionI[],
  elementUuid: string,
  updatedElement: ElementI,
): SectionI[] {
  return sections.map((section) => ({
    ...section,
    rows: section.rows.map((row) => ({
      ...row,
      columns: row.columns.map((column) => ({
        ...column,
        element: column.element?.uuid === elementUuid ? { ...updatedElement } : column.element,
      })),
    })),
  }));
}

export function updateConfigPageElement(
  pageElement: PageElementsConfigI,
  newConfig: { [key: string]: any },
): PageElementsConfigI {
  return {
    ...pageElement,
    config: newConfig,
  };
}

export function updateCssPageElement(
  pageElement: PageElementsConfigI,
  newCss: string,
): PageElementsConfigI {
  return {
    ...pageElement,
    css: newCss,
  };
}

export function deleteRow(sections: SectionI[], rowUuid: string): SectionI[] {
  return sections.map((section) => ({
    ...section,
    rows: section.rows.filter((row) => row.uuid !== rowUuid),
  }));
}

export function deleteColumn(sections: SectionI[], columnUuid: string): SectionI[] {
  return sections.map((section) => ({
    ...section,
    rows: section.rows.map((row) => ({
      ...row,
      columns: row.columns.filter((column) => column.uuid !== columnUuid),
    })),
  }));
}

export function deleteElement(sections: SectionI[], elementUuid: string): SectionI[] {
  return sections.map((section) => ({
    ...section,
    rows: section.rows.map((row) => ({
      ...row,
      columns: row.columns.map((column) => ({
        ...column,
        element: column.element?.uuid === elementUuid ? null : column.element,
      })),
    })),
  }));
}

export function findSectionByUuid(sections: SectionI[], uuid: string): SectionI | null {
  return sections.find((section) => section.uuid === uuid) ?? null;
}

export function findRowByUuid(sections: SectionI[], uuid: string): RowI | null {
  for (const section of sections) {
    const row = section.rows.find((row) => row.uuid === uuid);

    if (row) {
      return row;
    }
  }

  return null;
}

export function findColumnByUuid(sections: SectionI[], uuid: string): ColumnI | null {
  for (const section of sections) {
    for (const row of section.rows) {
      const column = row.columns.find((column) => column.uuid === uuid);

      if (column) {
        return column;
      }
    }
  }

  return null;
}

export function findElementByUuid(sections: SectionI[], uuid: string): ElementI | null {
  for (const section of sections) {
    for (const row of section.rows) {
      for (const column of row.columns) {
        if (column.element?.uuid === uuid) {
          return column.element;
        }
      }
    }
  }

  return null;
}

export const createPageConfig = (type: CanvasT): PageElementsConfigI => {
  return {
    css: `.${type === 'page' ? 'body' : type}{\n display: block;\n  width: 100%;\n  height: auto;\n  min-height: ${type === 'page' ? '600' : '200'}px;\n  padding-top: 10px;\n  padding-right: 10px;\n  padding-bottom: 10px;\n  padding-left: 10px;\n}`,
    config: { backgroundImage: '' },
  };
};

export const createElement = (elementSelected: ElementCMSI): ElementI => {
  const elementUuid = generateRandomString(8);
  return {
    uuid: elementUuid,
    css: `.${elementSelected.css}-${elementUuid}{\n display: block;\n  width: 100%;\n  height: auto;\n  min-height: 40px;\n  padding: 10px;\n  padding-top: 10px;\n  padding-right: 10px;\n  padding-bottom: 10px;\n  padding-left: 10px;\n}`,
    config: elementSelected.config,
    name: elementSelected.name,
    text: elementSelected.text,
    dataText: [],
  };
};

export const createColumn = (): ColumnI => {
  const columnUuid = generateRandomString(8);
  return {
    uuid: columnUuid,
    css: `.grid-column-${columnUuid}{\n display: block;\n  width: 100%;\n height: auto;\n  min-height: 40px;\n  padding-top: 12px;\n  padding-right: 12px;\n  padding-bottom: 12px;\n  padding-left: 12px;\n}`,
    config: { backgroundImage: '' },
    element: null,
  };
};

export const createRow = (): RowI => {
  const rowUuid = generateRandomString(8);
  return {
    uuid: rowUuid,
    css: `.grid-row-${rowUuid}{\n display: flex;\n  width: 100%;\n  height: auto;\n  min-height: 100px;\n  flex-direction: column;\n justify-content: space-between;\n  align-items: center;\n  gap: 4px;\n padding-top: 12px;\n  padding-right: 12px;\n  padding-bottom: 12px;\n  padding-left: 12px;\n position: relative;\n }\n @container (min-width: 834px) {\n .grid-row-${rowUuid} {\n flex-direction: row;\n}\n}`,
    config: { backgroundImage: '' },
    columns: [
      {
        ...createColumn(),
      },
    ],
  };
};

export const createSection = (): SectionI => {
  const sectionUuid = generateRandomString(8);
  return {
    uuid: sectionUuid,
    css: `.grid-section-${sectionUuid}{\n display: flex;\n  width: 100%;\n  height: auto;\n  min-height: 200px;\n  flex-direction: column;\n  gap: 4px;\n  padding-top: 12px;\n  padding-right: 12px;\n  padding-bottom: 12px;\n  padding-left: 12px;\n}`,
    config: {
      backgroundImage: '',
    },
    rows: [
      {
        ...createRow(),
      },
    ],
  };
};

const backgroundImageConfig = {
  key: 'backgroundImage',
  type: 'file',
  label: 'Imagen',
  props: {
    accept: 'image/png,image/jpeg,image/webp,image/svg+xml',
    placeholder: 'Seleccionar imagen',
    remove: 'Remover imagen',
    hint: 'Formatos permitidos: PNG, JPG, WEBP o SVG',
    type: 'image',
  },
};

export const SECTIONFORMTYPESCONFIG = [
  {
    ...backgroundImageConfig,
  },
] as unknown as RegisteredFieldTypes[];
export const COLUMNFORMTYPESCONFIG = [
  {
    ...backgroundImageConfig,
  },
] as unknown as RegisteredFieldTypes[];
export const ROWFORMTYPESCONFIG = [
  {
    ...backgroundImageConfig,
  },
] as unknown as RegisteredFieldTypes[];
export const PAGEFORMTYPESCONFIG = [
  {
    ...backgroundImageConfig,
  },
] as unknown as RegisteredFieldTypes[];

export function filterPath(path: string) {
  return path.replaceAll('\\', '/');
}

const BREAKPOINTSCSS = {
  mobileMax: 393,
  tabletMin: 394,
  tabletMax: 833,
  desktopMin: 834,
} as const;

export const DEFAULT_STATES = [':hover', ':focus', ':active', ':disabled', ':visited'] as const;
type CssState = (typeof DEFAULT_STATES)[number];

export function cssToJson(css: string): ResponsiveCssJsonI {
  const ast = csstree.parse(css) as StyleSheet;

  const result: ResponsiveCssJsonI = {
    selector: '',
    mobile: createStyleConfig(),
    tablet: createStyleConfig(),
    desktop: createStyleConfig(),
    states: createStyleConfig(),
  };

  // ==========================================
  // SELECTOR PRINCIPAL
  // ==========================================

  csstree.walk(ast, {
    visit: 'Rule',
    enter(node: any) {
      if (!result.selector) {
        result.selector = csstree.generate(node.prelude).trim();
      }
    },
  });

  const selector = result.selector;

  if (!selector) {
    return result;
  }

  // ==========================================
  // REGLAS BASE
  // SOLO REGLAS DIRECTAMENTE EN EL ROOT
  // ==========================================

  ast.children.forEach((node: any) => {
    if (node.type !== 'Rule') {
      return;
    }

    const ruleSelector = csstree.generate(node.prelude).trim();

    // ------------------------------
    // BASE
    // ------------------------------

    if (ruleSelector === selector) {
      Object.assign(result.mobile, parseDeclarations(node.block));

      return;
    }

    // ------------------------------
    // STATES
    // ------------------------------

    const state = getState(ruleSelector, selector);

    if (state) {
      result.states[state as keyof typeof result.states] = parseDeclarations(node.block);
    }
  });

  // ==========================================
  // MEDIA / CONTAINER QUERIES
  // ==========================================

  csstree.walk(ast, {
    visit: 'Atrule',

    enter(node: any) {
      if (node.name !== 'media' && node.name !== 'container') {
        return;
      }

      if (!node.prelude || !node.block) {
        return;
      }

      const query = csstree.generate(node.prelude).trim();

      const device = getDeviceFromQuery(query);

      if (!device) {
        return;
      }

      node.block.children.forEach((rule: any) => {
        if (rule.type !== 'Rule') {
          return;
        }

        const ruleSelector = csstree.generate(rule.prelude).trim();

        const declarations = parseDeclarations(rule.block);

        // ========================================
        // BASE
        // ========================================

        if (ruleSelector === selector) {
          Object.assign(result[device], declarations);

          return;
        }

        // ========================================
        // STATE
        // ========================================

        const state = getState(ruleSelector, selector);

        if (state && DEFAULT_STATES.includes(`:${state}` as CssState)) {
          const cssState = `:${state}` as CssState;

          result.states[cssState] = declarations;
        }
      });
    },
  });

  return result;
}

export function jsonToCss(json: ResponsiveCssJsonI): string {
  const { selector } = json;
  const css: string[] = [];

  // ============================================================
  // MOBILE
  // ============================================================
  const mobileBase = generateDeclarations(json.mobile, '  ');

  if (mobileBase) {
    css.push(`${selector} {\n` + `${mobileBase}\n` + `}`);
  }

  // ============================================================
  // TABLET
  // ============================================================
  const tabletBase = getOverrides(json.tablet, json.mobile);
  const tabletBaseCss = generateDeclarations(tabletBase, '    ');

  if (tabletBaseCss) {
    const rules: string[] = [];

    if (tabletBaseCss) {
      rules.push(`  ${selector} {\n` + `${tabletBaseCss}\n` + `  }`);
    }

    css.push(
      `@container (min-width: ${BREAKPOINTSCSS.tabletMin}px) and ` +
        `(max-width: ${BREAKPOINTSCSS.tabletMax}px) {\n` +
        `${rules.join('\n\n')}\n` +
        `}`,
    );
  }

  // ============================================================
  // DESKTOP
  // ============================================================
  const desktopBase = getOverrides(json.desktop, json.tablet);
  const desktopBaseCss = generateDeclarations(desktopBase, '    ');

  if (desktopBaseCss) {
    const rules: string[] = [];

    if (desktopBaseCss) {
      rules.push(`  ${selector} {\n` + `${desktopBaseCss}\n` + `  }`);
    }
    css.push(
      `@container (min-width: ${BREAKPOINTSCSS.desktopMin}px) {\n` +
        `${rules.join('\n\n')}\n` +
        `}`,
    );
  }

  // ============================================================
  // STATES
  // ============================================================
  const generalStates = json.states;
  const StateCss = generateStates(selector, generalStates, '');
  if (StateCss) {
    css.push(StateCss);
  }

  return css.join('\n\n');
}

function createStyleConfig(): Record<string, string> {
  return {};
}

function getDeviceFromQuery(query: string): DeviceT | null {
  const normalized = query
    .replace(/\s+/g, ' ')
    .replace(/\s*:\s*/g, ':')
    .trim();

  // MOBILE
  if (normalized === `(max-width:${BREAKPOINTSCSS.mobileMax}px)`) {
    return 'mobile';
  }

  // TABLET
  if (
    normalized ===
    `(min-width:${BREAKPOINTSCSS.tabletMin}px) and (max-width:${BREAKPOINTSCSS.tabletMax}px)`
  ) {
    return 'tablet';
  }

  // DESKTOP
  if (normalized === `(min-width:${BREAKPOINTSCSS.desktopMin}px)`) {
    return 'desktop';
  }

  return null;
}

function getState(selector: string, baseSelector: string): string | null {
  if (!selector.startsWith(`${baseSelector}:`)) {
    return null;
  }

  return selector.substring(baseSelector.length);
}

function parseDeclarations(block: csstree.Block): Record<string, string> {
  const styles: Record<string, string> = {};

  csstree.walk(block, {
    visit: 'Declaration',

    enter(node: any) {
      styles[toCamelCaseCssPropertie(node.property)] = csstree.generate(node.value).trim();
    },
  });

  return styles;
}

function toCamelCaseCssPropertie(property: string): string {
  return property.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function camelToKebabCssPropertie(property: string): string {
  return property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}

function generateDeclarations(styles: Record<string, string>, indent = ''): string {
  return Object.entries(styles)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([property, value]) => {
      return `${indent}${camelToKebabCssPropertie(property)}: ${value};`;
    })
    .join('\n');
}

function generateStates(
  selector: string,
  states: Record<string, Record<string, string>>,
  indent = '',
): string {
  return Object.entries(states)
    .map(([state, styles]) => {
      const declarations = generateDeclarations(styles, `${indent}  `);

      // No generar state si está vacío
      if (!declarations) {
        return '';
      }

      const cssState = state.startsWith(':') ? state : `:${state}`;

      return `${indent}${selector}${cssState} {\n` + declarations + `\n${indent}}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function getOverrides(
  current: Record<string, string>,
  previous: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [property, value] of Object.entries(current)) {
    if (previous[property] !== value) {
      result[property] = String(value);
    }
  }
  return result;
}

function getStateOverrides(
  currentStates: Record<string, Record<string, string>>,
  previousStates: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [state, currentStyles] of Object.entries(currentStates)) {
    const previousStyles = previousStates[state] ?? {};
    result[state] = getOverrides(currentStyles, previousStyles);
  }
  return result;
}

function filterStateOverrides(
  base: Record<string, string>,
  states: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [state, styles] of Object.entries(states)) {
    const overrides: Record<string, string> = {};
    for (const [property, value] of Object.entries(styles)) {
      if (base[property] !== value) {
        overrides[property] = String(value);
      }
    }
    result[state] = overrides;
  }
  return result;
}

export function parseRule(css: string) {
  const match = css.match(/([^{}]+)\s*\{([^{}]*)\}/);

  if (!match) {
    return null;
  }

  return {
    selector: match[1].trim(),
    body: match[2].trim(),
  };
}

export function splitStyles<T extends Record<string, any>>(
  source: Record<string, string>,
  template: T,
): T {
  const result = {} as T;

  for (const key of Object.keys(template) as (keyof T)[]) {
    const value = source[key as string];

    if (value !== undefined) {
      (result as Record<keyof T, string>)[key] = value;
    } else {
      (result as Record<keyof T, string>)[key] = '';
    }
  }

  return result;
}

export function mergeStyleConfig(
  defaultConfig: Record<string, string>,
  currentConfig: Record<string, string>,
): Record<string, string> {
  return {
    ...defaultConfig,
    ...currentConfig,
  };
}

export const defaultLayoutStyles: Required<LayoutStylesI> = {
  display: 'block',
  width: '100%',
  height: '100%',
  minWidth: '',
  maxWidth: '',
  minHeight: '40px',
  maxHeight: '',
  boxSizing: '',
  flexDirection: '',
  flexWrap: '',
  justifyContent: '',
  alignItems: '',
  alignContent: '',
  flexGrow: '',
  flexShrink: '',
  flexBasis: '',
  flex: '',
  alignSelf: '',
  gap: '',
  rowGap: '',
  columnGap: '',
};
export const defaultSpacingStyles: Required<SpacingStylesI> = {
  marginTop: '',
  marginRight: '',
  marginBottom: '',
  marginLeft: '',
  paddingTop: '10px',
  paddingRight: '10px',
  paddingBottom: '10px',
  paddingLeft: '10px',
};
export const defaultTypographyStyles: Required<TypographyStylesI> = {
  fontFamily: '',
  fontSize: '',
  fontWeight: '',
  lineHeight: '',
  letterSpacing: '',
  color: '',
  textAlign: '',
  textTransform: '',
  textDecoration: '',
  fontStyle: '',
  whiteSpace: '',
  wordBreak: '',
  textOverflow: '',
};
export const defaultBackgroundStyles: Required<BackgroundStylesI> = {
  backgroundColor: '',
  backgroundSize: '',
  backgroundPosition: '',
  backgroundRepeat: '',
  backgroundAttachment: '',
  backgroundClip: '',
};
export const defaultBorderStyles: Required<BorderStylesI> = {
  border: '',
  borderWidth: '',
  borderStyle: '',
  borderColor: '',
  borderTop: '',
  borderRight: '',
  borderBottom: '',
  borderLeft: '',
  borderRadius: '',
  borderTopLeftRadius: '',
  borderTopRightRadius: '',
  borderBottomRightRadius: '',
  borderBottomLeftRadius: '',
};
export const defaultEffetsStyles: Required<EffectsStylesI> = {
  opacity: '',
  boxShadow: '',
  transform: '',
  transition: '',
  filter: '',
  backdropFilter: '',
};
export const defaultInteractionStyles: Required<InteractionStylesI> = {
  cursor: '',
  pointerEvents: '',
};
export const defaultOverflowStyles: Required<OverflowStylesI> = {
  overflow: '',
  overflowX: '',
  overflowY: '',
};
export const defaultPositionStyles: Required<PositionStylesI> = {
  position: '',
  top: '',
  right: '',
  bottom: '',
  left: '',
  zIndex: '',
};
