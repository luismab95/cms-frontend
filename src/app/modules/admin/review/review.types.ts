import { PageDataMongoI, PageI } from '../pages/pages.types';

export type PageReviewStatus = 'pending' | 'approved' | 'rejected';

export interface PageReviewI {
    id: number;
    pageId: number;
    userId: number;
    status: PageReviewStatus;
    mongoId: string;
    comment: string;
}

export interface PageReviewDataI extends PageI {
    reviewId: number;
    reviewComment: string;
    reviewStatus: PageReviewStatus;
    reviewMongoId: string;
    micrositieName: string;
    dataReview?: PageDataMongoI;
}

export interface ReviewPageI {
    comment: string;
    status: PageReviewStatus;
}
