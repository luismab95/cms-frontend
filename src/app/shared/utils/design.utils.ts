import {
  BackgroundStylesI,
  BorderStylesI,
  DeviceT,
  EffectsStylesI,
  FontFamilyOptionI,
  InteractionStylesI,
  LayoutStylesI,
  OverflowStylesI,
  PositionStylesI,
  ResponsiveCssJsonI,
  SpacingStylesI,
  StylePermissionsT,
  TypographyStylesI,
} from '@shared/interfaces';
import * as csstree from 'css-tree';
import type { StyleSheet } from 'css-tree';

export const FONT_FAMILIES: FontFamilyOptionI[] = [
  // Sans Serif
  {
    label: 'System UI',
    value: 'system-ui,sans-serif',
    category: 'sans-serif',
  },
  {
    label: 'Inter',
    value: 'Inter,sans-serif',
    category: 'sans-serif',
  },
  {
    label: 'Arial',
    value: 'Arial,sans-serif',
    category: 'sans-serif',
  },
  {
    label: 'Helvetica',
    value: 'Helvetica,Arial,sans-serif',
    category: 'sans-serif',
  },
  {
    label: 'Segoe UI',
    value: 'Segoe UI,sans-serif',
    category: 'sans-serif',
  },
  {
    label: 'Verdana',
    value: 'Verdana,sans-serif',
    category: 'sans-serif',
  },
  {
    label: 'Tahoma',
    value: 'Tahoma,sans-serif',
    category: 'sans-serif',
  },
  {
    label: 'Trebuchet MS',
    value: 'Trebuchet MS,sans-serif',
    category: 'sans-serif',
  },
  {
    label: 'Geneva',
    value: 'Geneva,sans-serif',
    category: 'sans-serif',
  },
  {
    label: 'Calibri',
    value: 'Calibri,sans-serif',
    category: 'sans-serif',
  },
  // Serif
  {
    label: 'Georgia',
    value: 'Georgia,serif',
    category: 'serif',
  },
  {
    label: 'Times New Roman',
    value: 'Times New Roman,serif',
    category: 'serif',
  },
  {
    label: 'Times',
    value: 'Times,serif',
    category: 'serif',
  },
  {
    label: 'Garamond',
    value: 'Garamond,serif',
    category: 'serif',
  },
  {
    label: 'Baskerville',
    value: 'Baskerville,serif',
    category: 'serif',
  },
  {
    label: 'Palatino',
    value: 'Palatino Linotype,Palatino,serif',
    category: 'serif',
  },
  {
    label: 'Cambria',
    value: 'Cambria,serif',
    category: 'serif',
  },
  // Monospace
  {
    label: 'Courier New',
    value: 'Courier New,monospace',
    category: 'monospace',
  },
  {
    label: 'Courier',
    value: 'Courier,monospace',
    category: 'monospace',
  },
  {
    label: 'Consolas',
    value: 'Consolas,monospace',
    category: 'monospace',
  },
  {
    label: 'Monaco',
    value: 'Monaco,monospace',
    category: 'monospace',
  },
  {
    label: 'Menlo',
    value: 'Menlo,monospace',
    category: 'monospace',
  },
  {
    label: 'Lucida Console',
    value: 'Lucida Console,monospace',
    category: 'monospace',
  },
  // Display
  {
    label: 'Impact',
    value: 'Impact,fantasy',
    category: 'display',
  },

  // Cursive
  {
    label: 'Comic Sans MS',
    value: 'Comic Sans MS,cursive',
    category: 'cursive',
  },
  {
    label: 'Brush Script MT',
    value: 'Brush Script MT,cursive',
    category: 'cursive',
  },
];

const CONTAINER_STYLES: StylePermissionsT = {
  layout: true,
  spacing: true,
  background: true,
  border: true,
  position: true,
  effects: true,
  overflow: true,
  typography: false,
  interaction: false,
};

const ELEMENT_STYLES: StylePermissionsT = {
  layout: true,
  spacing: true,
  typography: true,
  border: true,
  position: true,
  effects: true,
  overflow: true,
  interaction: true,
  background: true,
};

export const STYLE_PERMISSIONS = {
  container: CONTAINER_STYLES,
  section: CONTAINER_STYLES,
  row: CONTAINER_STYLES,
  column: CONTAINER_STYLES,
  element: ELEMENT_STYLES,
} as const;

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

export function parseRule(css: string) {
  const match = css.match(/([^{}]+)\s*\{([^{}]*)\}/);
  if (!match) return null;

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
  fontFamily: 'Inter, sans-serif',
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
  borderTop: '',
  borderRight: '',
  borderBottom: '',
  borderLeft: '',
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
