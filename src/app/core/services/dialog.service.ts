import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { DialogI } from '../interfaces/dialog.interface';

@Injectable({ providedIn: 'root' })
export class DialogService {
  isOpen = signal<boolean>(false);
  dialogData = signal<DialogI | null>(null);

  readonly _actionClick = new Subject<boolean>();

  get actionClick$(): Observable<boolean> {
    return this._actionClick.asObservable();
  }

  setDialogData(data: DialogI) {
    this.dialogData.set(data);
  }

  toggleDialog() {
    this.isOpen.update((value) => !value);
  }

  actionClick(value: boolean) {
    this._actionClick.next(value);
  }
}
