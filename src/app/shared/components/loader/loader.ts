import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { ParameterService } from 'app/core/services/parameter.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'loader-component',
  templateUrl: './loader.html',
})
export class LoaderComponent implements OnInit {
  parameters = signal<ParameterI[]>([]);
  show = signal<boolean>(true);

  private _parameterService = inject(ParameterService);
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  /**
   * Constructor
   */
  constructor(private _changeDetectorRef: ChangeDetectorRef) {
    // Subscribe to user changes
    this._parameterService.parameter$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((parameters: ParameterI[]) => {
        this.parameters.set(parameters);
        this._changeDetectorRef.markForCheck();
      });
  }

  /**
   * On Init
   */
  ngOnInit(): void {
    setTimeout(() => {
      this.show.set(false);
    }, 3000);
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get parameter
   * @param code
   */
  getParameter(code: string) {
    if (this.parameters().length > 0) {
      return findParameter(code, this.parameters())?.value;
    }
    return '';
  }

  /**
   * Get logo
   * @returns
   */
  getLogo() {
    return `${this.getParameter('APP_STATICS_URL')}/${this.getParameter('LOGO_PRIMARY')}`;
  }
}
