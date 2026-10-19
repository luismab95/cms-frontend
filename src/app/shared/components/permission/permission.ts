import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserService } from '@core/services';

@Component({
  selector: 'permission-component',
  templateUrl: './permission.html',
  imports: [RouterLink],
})
export class PermissionComponent {
  show = input<boolean>(true);
  style = input<'full' | 'minimal'>('full');

  private readonly _userService = inject(UserService);

  readonly user = this._userService.userLogin;
  readonly role = this._userService.role;
}
