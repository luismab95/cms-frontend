import { Component, inject } from '@angular/core';
import { PageReviewService } from '@core/services';

@Component({
  selector: 'review-list',
  templateUrl: './review.html',
  imports: [],
})
export class ReviewPage {
  private readonly _pageReviewService = inject(PageReviewService);

  readonly reviewPage = this._pageReviewService.reviewPage;
}
