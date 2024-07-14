import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { HomeComponent } from 'app/modules/admin/dashboards/home/home.component';
import { HomeService } from 'app/modules/admin/dashboards/home/home.service';

export default [
    {
        path: '',
        component: HomeComponent,
        resolve: {
            data: () => inject(HomeService).getData(),
        },
    },
] as Routes;
