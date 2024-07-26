import { PageElementsI } from "app/shared/interfaces/grid.interface";

export interface TemplateI {
    id?: number;
    name: string;
    description: string;
    mongoI?: string;
    status?: boolean;
    data?: TemplateDataMongoI;
}



export interface TemplateDataMongoI {
    header: PageElementsI;
    footer: PageElementsI;
}

export interface TemplateMongoI {
    data: TemplateDataMongoI;
}
