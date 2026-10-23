import { PaginationResquestI } from '@shared/interfaces';
import { PageDataMongoI, PageI } from './page.interface';

export interface ReviewPageDataI extends Partial<Pick<PageI, 'name' | 'path' | 'status'>> {
  id: number;
  pageId: number;
  comment: string;
  comments: ReviewCommentI[];
  mongoId: string;
  statusReview: PageReviewStatus;
  userChangesId: number;
  userReviewId: number;
  userReview?: string;
  userChanges?: string;
  dataReview?: PageDataMongoI;
}

export type PageReviewStatus = 'pending' | 'assigned' | 'approved' | 'rejected';

export interface PageReviewPaginationResquestI extends PaginationResquestI {
  statusReview: PageReviewStatus | null;
}

export interface TablePageReviewSearchI {
  search: string;
  status: PageReviewStatus | null;
}

export interface ReviewCommentI {
  type: TypeReviewItemT;
  uuid: string;
  comment: string;
}

export type TypeReviewItemT =
  'section' | 'row' | 'column' | 'element' | 'body' | 'header' | 'footer';

export interface ReviewModelI {
  status: PageReviewStatus | null;
  comment: string;
  comments: ReviewCommentI[];
}

export interface ActionReviewI {
  id: string;
  value: string;
  disabled: boolean;
}
