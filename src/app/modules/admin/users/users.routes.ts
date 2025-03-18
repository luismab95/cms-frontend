import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { RoleService } from 'app/shared/services/role.service';
import { UsersListComponent } from './list.component';

export default [
    {
        path: '',
        component: UsersListComponent,
        resolve: {
            users: () =>
                inject(UserService).getAll({
                    limit: 10,
                    page: 1,
                    search: null,
                    status: true,
                }),
            roles: () => inject(RoleService).getAll(),
        },
    },
] as Routes;
