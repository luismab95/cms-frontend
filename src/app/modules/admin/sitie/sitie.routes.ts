import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { TemplateService } from '../templates/templates.service';
import { LanguageService } from './languages/language.service';
import { SitieComponent } from './sitie.component';
import { SitieService } from './sitie.service';

export default [
    {
        path: '',
        component: SitieComponent,
        resolve: {
            sitie: () => inject(SitieService).find(),
            languages: () =>
                inject(LanguageService).getAll({
                    page: 1,
                    limit: 10,
                    search: null,
                    status: true,
                }),
            templates: () =>
                inject(TemplateService).getAll({
                    page: 1,
                    limit: 99999,
                    search: null,
                    status: true,
                }),
        },
    },
] as Routes;
