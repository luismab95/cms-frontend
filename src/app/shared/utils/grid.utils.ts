import { CanvasT } from '@core/interfaces';
import { RegisteredFieldTypes } from '@ng-forge/dynamic-forms';
import {
  SectionI,
  RowI,
  ColumnI,
  ElementI,
  PageElementsConfigI,
  ElementCMSI,
} from '@shared/interfaces';
import { generateRandomString } from './random.utils';

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
