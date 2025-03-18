import { inject } from '@angular/core';
import { NotificationsService } from 'app/layout/common/notifications/notifications.service';
import { forkJoin } from 'rxjs';
import { UserService } from './core/user/user.service';

export const initialDataResolver = () => {
    const _notificationsService = inject(NotificationsService);
    const _userService = inject(UserService);

    return forkJoin([
        _userService.getSession(),
        _notificationsService.getAll(),
    ]);
};
