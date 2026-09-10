import { Component, input } from '@angular/core';

@Component({
  selector: 'permission-component',
  templateUrl: './permission.html',
  imports: [],
})
export class PermissionComponent {
  show = input<boolean>(true);

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------
}
