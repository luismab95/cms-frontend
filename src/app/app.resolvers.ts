import { inject } from '@angular/core';
import { NotificationsService } from 'app/layout/common/notifications/notifications.service';
import { forkJoin } from 'rxjs';
import { UserService } from './core/user/user.service';

export const initialDataResolver = () => {
    // const _navigationService = inject(NavigationService);
    const _notificationsService = inject(NotificationsService);
    const _userService = inject(UserService);

    // Fork join multiple API endpoint calls to wait all of them to finish
    return forkJoin([
        _userService.getSession(),
        _notificationsService.getAll(),
    ]);
};
