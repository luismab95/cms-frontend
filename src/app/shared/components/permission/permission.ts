import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserService } from 'app/core/services/user.service';

@Component({
  selector: 'permission-component',
  templateUrl: './permission.html',
  imports: [RouterLink],
})
export class PermissionComponent {
  show = input<boolean>(true);

  private readonly _userService = inject(UserService);

  readonly user = toSignal(this._userService.userLogin$, { initialValue: null });
  readonly role = toSignal(this._userService.role$, { initialValue: null });

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------
}
