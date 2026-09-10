import { Component, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent } from 'app/shared/components/loading-bar/loading-bar';
import { Subject } from 'rxjs';

@Component({
  selector: 'empty-layout',
  templateUrl: './empty.html',
  imports: [RouterOutlet, LoadingBarComponent],
})
export class EmptyLayout implements OnDestroy {
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
