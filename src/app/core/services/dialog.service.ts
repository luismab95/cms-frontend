import { Injectable, signal } from '@angular/core';
import { DialogI } from '@core/interfaces';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DialogService {
  isOpen = signal<boolean>(false);
  dialogData = signal<DialogI | null>(null);

  readonly _actionClick = new Subject<boolean>();

  /**
   * Getter for action click observable
   * @returns
   */
  get actionClick$(): Observable<boolean> {
    return this._actionClick.asObservable();
  }

  /**
   * Sets the data for the dialog
   * @param data
   */
  setDialogData(data: DialogI) {
    this.dialogData.set(data);
  }

  /**
   * Toggles the dialog open/close state
   */
  toggleDialog() {
    this.isOpen.update((value) => !value);
  }

  /***
   * Closes the dialog
   */
  closeDialog() {
    this.isOpen.set(false);
  }

  /**
   * Emits an action click event
   * @param value
   */
  actionClick(value: boolean) {
    this._actionClick.next(value);
  }
}
