import { Component, inject } from '@angular/core';
import { DialogService } from '@core/services';

@Component({
  selector: 'dialog-component',
  templateUrl: './dialog.html',
})
export class DialogComponent {
  public readonly _dialogService = inject(DialogService);

  /**
   * Confirm click
   */
  onConfirmAction() {
    this._dialogService._actionClick.next(true);
    this._dialogService.toggleDialog();
    this._dialogService._actionClick.next(false);
  }

  /**
   * Cancel click
   */
  onCancelAction() {
    this._dialogService._actionClick.next(false);
    this._dialogService.toggleDialog();
  }
}
