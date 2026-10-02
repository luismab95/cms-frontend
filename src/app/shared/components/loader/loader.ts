import { Component, OnInit, inject, output, signal } from '@angular/core';
import { ParameterService } from '@core/services';
import { findParameter } from '@shared/utils';

@Component({
  selector: 'loader-component',
  templateUrl: './loader.html',
})
export class LoaderComponent implements OnInit {
  stopLoader = output<boolean>();

  show = signal<boolean>(true);

  private _parameterService = inject(ParameterService);

  readonly parameters = this._parameterService.publicParameters;

  /**
   * On Init
   */
  ngOnInit(): void {
    setTimeout(() => {
      this.show.set(false);
      this.stopLoader.emit(true);
    }, 3000);
  }

  /**
   * Get parameter
   * @param code
   */
  getParameter(code: string): string {
    if (this.parameters().length > 0) return findParameter(code, this.parameters())?.value ?? '';
    return '';
  }

  /**
   * Get logo
   * @returns
   */
  getLogo() {
    return `${this.getParameter('APP_STATICS_URL')}/${this.getParameter('LOGO_PRIMARY')}`;
  }

  /**
   * Get company parameters
   * @param code
   * @returns
   */
  getCompanyInfo(code: string) {
    return findParameter(code, this.parameters());
  }

  /**
   * Getter for current year
   */
  get currentYear(): number {
    return new Date().getFullYear();
  }
}
