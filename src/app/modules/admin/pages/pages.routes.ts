import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { LanguageService } from '../sitie/languages/language.service';
import { SitieService } from '../sitie/sitie.service';
import { PagesDetailComponent } from './detail/detail.component';
import { PagesListComponent } from './list.component';
import { PageService } from './pages.service';

export default [
    {
        path: '',
        component: PagesListComponent,
        resolve: {
            pages: () =>
                inject(PageService).getAll({
                    limit: 10,
                    page: 1,
                    search: null,
                    status: true,
                    micrositieId: null,
                }),
        },
    },

    {
        path: 'detail',
        component: PagesDetailComponent,
        resolve: {
            page: () =>
                inject(PageService).find(
                    inject(Router).getCurrentNavigation()?.extras?.state?.id
                ),
            sitie: () => inject(SitieService).find(),
            languages: () =>
                inject(LanguageService).getAll({
                    limit: 99999,
                    page: 1,
                    search: null,
                    status: true,
                }),
        },
    },
] as Routes;
