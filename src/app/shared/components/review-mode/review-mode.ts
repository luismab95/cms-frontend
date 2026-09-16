import { Component, input, output } from '@angular/core';

@Component({
  selector: 'review-mode',
  templateUrl: './review-mode.html',
  imports: [],
})
export class ReviewModeComponent {
  lastChangeReject = input(false);
  comment = input('false');
  deleteChangeEvent = output<boolean>();

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Delete changes
   */
  deleteChanges() {
    this.deleteChangeEvent.emit(true);
  }
}
