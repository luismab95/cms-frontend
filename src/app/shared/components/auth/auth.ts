import { Component, input, OnInit } from '@angular/core';
import { ParameterI } from 'app/core/interfaces/parameter.interface';
import { findParameter, getLogo } from 'app/shared/utils/parameter.utils';

@Component({
  selector: 'auth-component',
  templateUrl: './auth.html',
  imports: [],
})
export class AuthComponent implements OnInit {
  readonly parameters = input<ParameterI[]>([]);

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {}

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

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
