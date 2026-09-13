import { Injectable, signal } from '@angular/core';
import { DialogI } from '../interfaces/dialog.interface';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DialogService {
  isOpen = signal<boolean>(false);
  dialogData = signal<DialogI | null>(null);

  _actionClick: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  /**
   *  getter for actionClick
   * @param value
   */
  get actionClick$(): Observable<boolean> {
    return this._actionClick.asObservable();
  }

  /**
   * Set data to dialog
   * @param data
   *
   */
  setDialogData(data: DialogI) {
    this.dialogData.set(data);
  }

  /**
   * Toggle dialog
   */
  toggleDialog() {
    this.isOpen.update((value) => !value);
  }
}
