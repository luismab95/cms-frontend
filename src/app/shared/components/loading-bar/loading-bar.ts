import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LoaderService } from '@core/services';

@Component({
  selector: 'loading-bar-component',
  templateUrl: './loading-bar.html',
  imports: [],
})
export class LoadingBarComponent {
  private readonly _loaderService = inject(LoaderService);

  readonly show = toSignal(this._loaderService.isLoading, { initialValue: true });
}
