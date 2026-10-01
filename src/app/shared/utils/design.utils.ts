import { FontFamilyOptionI, StylePermissionsT } from '../interfaces/design.interface';

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
