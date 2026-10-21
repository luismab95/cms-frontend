import { PaginationResquestI } from '@shared/interfaces';
import { PageDataMongoI, PageI } from './page.interface';

export interface ReviewPageDataI extends Partial<Pick<PageI, 'name' | 'path' | 'status'>> {
  id: number;
  pageId: number;
  comment: string;
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
