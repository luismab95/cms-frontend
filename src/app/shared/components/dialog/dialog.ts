import { Component, inject, OnInit } from '@angular/core';
import { DialogService } from 'app/core/services/dialog.service';

@Component({
  selector: 'dialog-component',
  templateUrl: './dialog.html',
})
export class DialogComponent implements OnInit {
  public _dialogService = inject(DialogService);

  /**
   * Constructor
   */
  constructor() {}

  /**
   * On Init
   */
  ngOnInit(): void {}

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
