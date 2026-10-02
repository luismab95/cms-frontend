import { inject } from '@angular/core';
import { NotificationsService, UserService } from '@core/services';
import { forkJoin } from 'rxjs';

/**
 * Initial Resolvers
 * @returns
 */
export const initialDataResolver = () => {
  const _notificationsService = inject(NotificationsService);
  const _userService = inject(UserService);

  return forkJoin([_userService.getSession(), _notificationsService.getAll()]);
};
