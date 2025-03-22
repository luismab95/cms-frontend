import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { HomeComponent } from 'app/modules/admin/dashboards/home/home.component';
import { HomeService } from 'app/modules/admin/dashboards/home/home.service';

export default [
    {
        path: '',
        component: HomeComponent,
        resolve: {
            countElements: () => inject(HomeService).getCountElements(),
            top10Pages: () => inject(HomeService).getTop10Pages(),
            visitVsPages: () => inject(HomeService).getVisitVsPages(),
            weekVisit: () => inject(HomeService).getWeekVisit(),
            yearVisit: () => inject(HomeService).getYearVisit(),
        },
    },
] as Routes;
