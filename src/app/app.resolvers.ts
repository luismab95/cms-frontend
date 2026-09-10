import { inject } from '@angular/core';
import { forkJoin } from 'rxjs';
import { UserService } from './core/services/user.service';
import { NotificationsService } from './core/services/notifications.service';

export const initialDataResolver = () => {
  const _notificationsService = inject(NotificationsService);
  const _userService = inject(UserService);

  return forkJoin([
    _userService.getSession(),
    _notificationsService.getAll(),
  ]);
};
