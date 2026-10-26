import { PaginationResquestI } from '@shared/interfaces';
import { PageDataMongoI, PageI } from './page.interface';
import { TemplateDataMongoI, TemplateI } from './template.interface';

export type TypeReviewT = 'template' | 'page';

export interface ReviewPageDataI extends Partial<Pick<PageI, 'name' | 'path' | 'status'>> {
  id: number;
  pageId: number | null;
  templateId: number | null;
  comment: string;
  comments: ReviewCommentI[];
  type: TypeReviewT;
  mongoId: string;
  statusReview: PageReviewStatusT;
  userChangesId: number;
  userReviewId: number;
  userReview?: string;
  userChanges?: string;
  dataReview?: PageDataMongoI | TemplateDataMongoI;
}

export interface ReviewEntityI {
  id: number;
  status: PageReviewStatusT;
  type: TypeReviewT;
  data: PageI | TemplateI;
}

export type PageReviewStatusT = 'pending' | 'assigned' | 'approved' | 'rejected';

export interface PageReviewPaginationResquestI extends PaginationResquestI {
  statusReview: PageReviewStatusT | null;
}

export interface TablePageReviewSearchI {
  search: string;
  status: PageReviewStatusT | null;
}

export interface ReviewCommentI {
  type: TypeReviewItemT;
  uuid: string;
  comment: string;
}

export type TypeReviewItemT =
  'section' | 'row' | 'column' | 'element' | 'body' | 'header' | 'footer';

export interface ReviewModelI {
  status: PageReviewStatusT | null;
  comment: string;
  comments: ReviewCommentI[];
}

export interface ActionReviewI {
  id: string;
  value: string;
  disabled: boolean;
}
