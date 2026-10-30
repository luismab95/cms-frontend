import { CanvasT } from '@core/interfaces';
import { ChildrenSchemaI, ElementCMSI, ElementDataI, ElementKindT } from './element.interface';

export interface SelectedItemsInGridI {
  page: PageElementsConfigI | null;
  section: SectionI | null;
  row: RowI | null;
  column: ColumnI | null;
  element: ElementI | null;
  canvas: CanvasT;
}

export interface PageElementsConfigI {
  css: string;
  config: { [key: string]: any };
}

export interface PageElementsI extends PageElementsConfigI {
  data: SectionI[];
  title?: string;
}

export interface ElementChildrenSchemaI {
  slot: string;
  uuid: string;
}


export interface ElementI {
  uuid: string;
  code: string;
  slot: string;
  name: string;
  css: string;
  config: { [key: string]: any };
  text: { [key: string]: any };
  dataText?: ElementDataI[];
  kind: ElementKindT;
  childrens: ElementI[];
  childrenSchema: ElementChildrenSchemaI[];
}

export interface ColumnI {
  uuid: string;
  css: string;
  config: { [key: string]: any };
  element: ElementI | null;
}

export interface RowI {
  uuid: string;
  css: string;
  config: { [key: string]: any };
  columns: ColumnI[];
}

export interface SectionI {
  uuid: string;
  css: string;
  config: { [key: string]: any };
  rows: RowI[];
}

export interface HistoryCMSI {
  header: PageElementsI | null;
  body: PageElementsI | null;
  footer: PageElementsI | null;
}

export interface HistoryChangeI {
  previous: HistoryCMSI;
  next: HistoryCMSI;
}
