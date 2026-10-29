import { Component, computed, inject, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReviewPageI } from '@core/interfaces';
import { findElementByUuid } from '@shared/utils';
import { CanvasService } from '@core/services';

@Component({
  selector: 'review-mode',
  templateUrl: './review-mode.html',
  imports: [NgClass],
})
export class ReviewModeComponent {
  reviewRejectChanges = input.required<boolean>();
  reviewPage = input.required<ReviewPageI>();
  deleteChangeEvent = output<boolean>();

  private readonly _canvasService = inject(CanvasService);

  readonly sectionsInCanvas = computed(() => {
    const header = this._canvasService.sectionsByTypeReview['header'].get();
    const page = this._canvasService.sectionsByTypeReview['page'].get();
    const footer = this._canvasService.sectionsByTypeReview['footer'].get();
    return [...header, ...page, ...footer];
  });

  /**
   * Delete changes
   */
  deleteChanges() {
    this.deleteChangeEvent.emit(true);
  }

  /**
   * Find element
   * @param uuid
   * @returns
   */
  findElement(uuid: string) {
    const element = findElementByUuid(this.sectionsInCanvas(), uuid);
    if (element === null) return '';
    return element.name;
  }
}
