import { PageElementsI } from 'app/shared/interfaces/grid.interface';
import { PaginationResquestI } from 'app/shared/interfaces/response.interface';

export declare enum ModeEnum {
    EDIT = 'edit',
    PUBLISH = 'publish',
    REVIEW = 'review',
}

export interface ReferenceI {
    id?: number;
    ref: string;
    status?: boolean;
    languageId: number;
    text: string;
}

export interface PageDataMongoI {
    body: PageElementsI;
}

export interface PageDetailReferenceI {
    languageId: number;
    alias: ReferenceI;
    description: ReferenceI;
    keywords: ReferenceI;
}

export interface PageI {
    id?: number;
    name: string;
    path?: string;
    mongoId?: string;
    isHomePage?: boolean;
    sitieId?: number;
    micrositieId?: number | null;
    mode?: ModeEnum;
    status?: boolean;
    data?: PageDataMongoI;
    draft?: PageDataMongoI;
    details?: PageDetailReferenceI[];
    detail?: UpdateDetailPageI[];
    aliasRef?: string;
    descriptionRef?: string;
    seoKeywordsRef?: string;
}

export interface UpdateDetailPageI {
    lang: number;
    references?: { ref: string; value: string }[];
}

export interface PagePaginationResquestI extends PaginationResquestI {
    micrositieId: number | null;
}
