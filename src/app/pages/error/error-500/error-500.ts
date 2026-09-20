import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'error-500',
  templateUrl: './error-500.html',
  imports: [RouterLink],
})
export class Error500 {
  /**
   * Constructor
   */
  constructor() {}
}
