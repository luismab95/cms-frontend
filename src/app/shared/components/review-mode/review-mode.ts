import { Component, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { ReviewPageI } from '@core/interfaces';

@Component({
  selector: 'review-mode',
  templateUrl: './review-mode.html',
  imports: [NgClass],
})
export class ReviewModeComponent {
  reviewPage = input.required<ReviewPageI>();
  deleteChangeEvent = output<boolean>();

  /**
   * Delete changes
   */
  deleteChanges() {
    this.deleteChangeEvent.emit(true);
  }
}
