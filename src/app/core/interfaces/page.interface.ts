import { PaginationResquestI } from 'app/shared/interfaces/response.interface';
import { PageElementsI } from 'app/shared/interfaces/grid.interface';
import { TemplateI } from './template.interface';

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

export interface OnlyPageDetailReferenceI {
  languageId: number;
  alias: string;
  description: string;
  keywords: string;
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
  dataReview?: PageDataMongoI;
  data?: PageDataMongoI;
  draft?: PageDataMongoI | null;
  details?: PageDetailReferenceI[];
  detail?: UpdateDetailPageI[];
  aliasRef?: string;
  descriptionRef?: string;
  seoKeywordsRef?: string;
  review?: boolean;
  lastChangeReject?: boolean;
  commentReject?: string;
}

export interface PageRenderI extends PageI {
  languageId: number;
  languageCode: string;
  template: TemplateI;
}

export interface UpdateDetailPageI {
  lang: number;
  references?: { ref: string; value: string }[];
}

export interface PagePaginationResquestI extends PaginationResquestI {
  micrositieId: number | null;
}

export interface GetPageI {
  lang?: string;
  page: string;
  micrositie?: string;
  preview: boolean;
}

export type PreviewModeT = 'none' | 'mobile' | 'tablet' | 'desktop';
export type CanvasT = 'page' | 'header' | 'footer';
