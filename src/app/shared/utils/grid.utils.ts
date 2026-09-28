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
import { ResponsiveCssJsonI, DeviceT, StyleConfigI } from '../interfaces/design.interface';

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

export const createElement = (elementSelected: ElementCMSI): ElementI => {
  const elementUuid = generateRandomString(8);
  return {
    uuid: elementUuid,
    css: `.${elementSelected.css}-${elementUuid}{}`,
    config: elementSelected.config,
    name: elementSelected.name,
    text: elementSelected.text,
    dataText: [],
  };
};

export const createColumn = (): ColumnI => {
  const uuid = generateRandomString(8);
  return {
    uuid,
    css: `.grid-column-${uuid}{}`,
    config: {
      backgroundImage: '',
    },
    element: null,
  };
};

export const createRow = (): RowI => {
  const uuid = generateRandomString(8);
  return {
    uuid,
    css: `.grid-column-${uuid}{}`,
    config: {
      backgroundImage: '',
    },
    columns: [],
  };
};

export const createSection = (): SectionI => {
  const sectionUuid = generateRandomString(8);
  const rowUuid = generateRandomString(8);
  const columnUuid = generateRandomString(8);
  return {
    uuid: sectionUuid,
    css: `.grid-section-${sectionUuid}{}`,
    config: {
      backgroundImage: '',
    },
    rows: [
      {
        uuid: rowUuid,
        css: `.grid-row-${rowUuid}{}`,
        config: { backgroundImage: '' },
        columns: [
          {
            uuid: columnUuid,
            css: `.grid-column-${columnUuid}{}`,
            config: { backgroundImage: '' },
            element: null,
          },
        ],
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
  const ast = csstree.parse(css);

  const result: ResponsiveCssJsonI = {
    selector: '',
    mobile: createStyleConfig(),
    tablet: createStyleConfig(),
    desktop: createStyleConfig(),
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
  // REGLAS FUERA DE MEDIA
  // ==========================================

  csstree.walk(ast, {
    visit: 'Rule',

    enter(node: any) {
      const ruleSelector = csstree.generate(node.prelude).trim();

      if (ruleSelector === selector) {
        Object.assign(result.mobile.base, parseDeclarations(node.block));
      } else {
        const state = getState(ruleSelector, selector);

        if (state) {
          result.mobile.states[state] = parseDeclarations(node.block);
        }
      }
    },
  });

  // ==========================================
  // MEDIA QUERIES
  // ==========================================

  csstree.walk(ast, {
    visit: 'Atrule',

    enter(node: any) {
      if (node.name !== 'media') {
        return;
      }

      if (!node.prelude || !node.block) {
        return;
      }

      const media = csstree.generate(node.prelude).trim();

      let device: DeviceT | null = null;

      // MOBILE

      if (media === `(max-width: ${BREAKPOINTSCSS.mobileMax}px)`) {
        device = 'mobile';
      }

      // TABLET
      else if (
        media ===
        `(min-width: ${BREAKPOINTSCSS.tabletMin}px) and (max-width: ${BREAKPOINTSCSS.tabletMax}px)`
      ) {
        device = 'tablet';
      }

      // DESKTOP
      else if (media === `(min-width: ${BREAKPOINTSCSS.desktopMin}px)`) {
        device = 'desktop';
      }

      if (!device) {
        return;
      }

      // ----------------------------------------
      // Buscar reglas dentro del @container
      // ----------------------------------------

      csstree.walk(node.block, {
        visit: 'Rule',

        enter(rule: any) {
          const ruleSelector = csstree.generate(rule.prelude).trim();

          const declarations = parseDeclarations(rule.block);

          // ========================================
          // BASE / NORMAL
          // ========================================

          if (ruleSelector === selector) {
            Object.assign(result[device].base, declarations);
            return;
          }

          // ========================================
          // STATE
          // ========================================

          const state = getState(ruleSelector, selector);

          if (state && DEFAULT_STATES.includes(`:${state}` as CssState)) {
            result[device].states[`:${state}`] = declarations;
          }
        },
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

  const mobileStates = filterStateOverrides(json.mobile.base, json.mobile.states);

  const mobileBase = generateDeclarations(json.mobile.base, '  ');

  const mobileStateCss = generateStates(selector, mobileStates, '');

  if (mobileBase) {
    css.push(`${selector} {\n` + `${mobileBase}\n` + `}`);
  }

  if (mobileStateCss) {
    css.push(mobileStateCss);
  }

  // ============================================================
  // TABLET
  // ============================================================

  const tabletBase = getOverrides(json.tablet.base, json.mobile.base);

  // Primero filtramos los estados de tablet contra
  // el base de tablet.
  const tabletStates = filterStateOverrides(json.tablet.base, json.tablet.states);

  // Luego eliminamos propiedades que ya existen
  // en el mismo estado de mobile.
  const tabletStateOverrides = getStateOverrides(tabletStates, mobileStates);

  const tabletBaseCss = generateDeclarations(tabletBase, '    ');

  const tabletStateCss = generateStates(selector, tabletStateOverrides, '  ');

  if (tabletBaseCss || tabletStateCss) {
    const rules: string[] = [];

    if (tabletBaseCss) {
      rules.push(`  ${selector} {\n` + `${tabletBaseCss}\n` + `  }`);
    }

    if (tabletStateCss) {
      rules.push(tabletStateCss);
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

  const desktopBase = getOverrides(json.desktop.base, json.tablet.base);

  const desktopStates = filterStateOverrides(json.desktop.base, json.desktop.states);

  const desktopStateOverrides = getStateOverrides(desktopStates, tabletStates);

  const desktopBaseCss = generateDeclarations(desktopBase, '    ');

  const desktopStateCss = generateStates(selector, desktopStateOverrides, '  ');

  if (desktopBaseCss || desktopStateCss) {
    const rules: string[] = [];

    if (desktopBaseCss) {
      rules.push(`  ${selector} {\n` + `${desktopBaseCss}\n` + `  }`);
    }

    if (desktopStateCss) {
      rules.push(desktopStateCss);
    }

    css.push(
      `@container (min-width: ${BREAKPOINTSCSS.desktopMin}px) {\n` +
        `${rules.join('\n\n')}\n` +
        `}`,
    );
  }

  return css.join('\n\n');
}

function createStyleConfig(): StyleConfigI {
  return {
    base: {},
    states: {
      ':hover': {},
      ':focus': {},
      ':active': {},
      ':disabled': {},
      ':visited': {},
    },
  };
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

function generateDeclarations(styles: Record<string, string | number>, indent = ''): string {
  return Object.entries(styles)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([property, value]) => {
      return `${indent}${camelToKebabCssPropertie(property)}: ${value};`;
    })
    .join('\n');
}

function generateStates(
  selector: string,
  states: Record<string, Record<string, string | number>>,
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
  current: Record<string, string | number>,
  previous: Record<string, string | number>,
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
  base: Record<string, string | number>,
  states: Record<string, Record<string, string | number>>,
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
  source: Record<string, string | number>,
  template: T,
): T {
  const result = {} as T;

  for (const key of Object.keys(template) as (keyof T)[]) {
    const value = source[key as string];

    if (value !== undefined) {
      (result as Record<keyof T, string | number>)[key] =
        typeof template[key] === 'number' ? Number(value) : value;
    } else {
      (result as Record<keyof T, string | number>)[key] =
        typeof template[key] === 'number' ? 0 : '';
    }
  }

  return result;
}

export function mergeStyleConfig(
  defaultConfig: StyleConfigI,
  currentConfig: StyleConfigI,
): StyleConfigI {
  const states = {
    ...defaultConfig.states,
  };

  for (const state of Object.keys(currentConfig.states)) {
    states[state] = {
      ...defaultConfig.states[state],
      ...currentConfig.states[state],
    };
  }

  return {
    ...defaultConfig,
    base: {
      ...defaultConfig.base,
      ...currentConfig.base,
    },
    states,
  };
}
