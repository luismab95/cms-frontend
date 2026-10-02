import { Component, input } from '@angular/core';
import { ParameterI } from '@core/interfaces';
import { findParameter, getLogo } from '@shared/utils';

@Component({
  selector: 'auth-component',
  templateUrl: './auth.html',
  imports: [],
})
export class AuthComponent {
  readonly parameters = input<ParameterI[]>([]);

  /**
   * Get value of auth background
   * @returns
   */
  getAuthBackground() {
    return getLogo('LOGO_AUTH_BACKGROUND', this.parameters());
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
