import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { LoaderService } from '../../../core/services/loader.service';

@Component({
  selector: 'loading-bar-component',
  templateUrl: './loading-bar.html',
  imports: [],
})
export class LoadingBarComponent implements OnInit, OnDestroy {
  show = signal<boolean>(true);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _loaderService = inject(LoaderService);

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On Init
   */
  ngOnInit(): void {
    // suscribe to loader
    this._loaderService.isLoading.pipe(takeUntil(this._unsubscribeAll)).subscribe((res) => {
      this.show.set(res);
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
