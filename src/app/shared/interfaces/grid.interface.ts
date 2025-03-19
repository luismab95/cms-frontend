import { ElementDataI } from './element.interface';

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
    element: ElementI;
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
