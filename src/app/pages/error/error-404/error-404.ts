import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'error-404',
  templateUrl: './error-404.html',
  imports: [RouterLink],
})
export class Error404 {
  /**
   * Constructor
   */
  constructor() {}
}
