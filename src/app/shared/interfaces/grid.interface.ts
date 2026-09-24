import { CanvasT } from 'app/core/interfaces/page.interface';
import { ElementDataI } from './element.interface';

export interface SelectedItemsInGridI {
  section: SectionI | null;
  row: RowI | null;
  column: ColumnI | null;
  element: ElementI | null;
  canvas: CanvasT;
}

export interface PageElementsI {
  css: string;
  data: SectionI[];
  config: { [key: string]: any };
  title?: string;
}

export interface ElementI {
  uuid: string;
  name: string;
  css: string;
  config: { [key: string]: any };
  text: { [key: string]: any };
  dataText?: ElementDataI[];
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

export interface HistoryChangeI {
  previous: SectionI[];
  next: SectionI[];
}
