import { RegisteredFieldTypes } from '@ng-forge/dynamic-forms';
import { ColumnI, SectionI } from '../interfaces/grid.interface';

export function validGrid(data: any): boolean {
  let result: boolean = true;
  return result;
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

export const SECTIONFORMTYPESCONFIG = [] as RegisteredFieldTypes[];
export const COLUMNFORMTYPESCONFIG = [] as RegisteredFieldTypes[];
export const ROWFORMTYPESCONFIG = [] as RegisteredFieldTypes[];
