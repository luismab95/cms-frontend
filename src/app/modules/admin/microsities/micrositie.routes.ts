import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { SitieService } from '../sitie/sitie.service';
import { MicroSitiesDetailComponent } from './detail/detail.component';
import { MicrositieListComponent } from './list.component';
import { MicrosityService } from './micrositie.service';

export default [
    {
        path: '',
        component: MicrositieListComponent,
        resolve: {
            microsities: () =>
                inject(MicrosityService).getAll({
                    page: 1,
                    limit: 10,
                    search: null,
                    status: true,
                }),
        },
    },
    {
        path: 'detail',
        component: MicroSitiesDetailComponent,
        resolve: {
            sitie: () => inject(SitieService).find(),
        },
    },
] as Routes;
