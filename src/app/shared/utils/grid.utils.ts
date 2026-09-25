import { RegisteredFieldTypes } from '@ng-forge/dynamic-forms';
import { ColumnI, ElementI, RowI, SectionI } from '../interfaces/grid.interface';
import { generateRandomString } from './random.utils';

export function validGrid(data: any): boolean {
  let result: boolean = true;
  return result;
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

export const SECTIONFORMTYPESCONFIG = [] as RegisteredFieldTypes[];
export const COLUMNFORMTYPESCONFIG = [] as RegisteredFieldTypes[];
export const ROWFORMTYPESCONFIG = [] as RegisteredFieldTypes[];
