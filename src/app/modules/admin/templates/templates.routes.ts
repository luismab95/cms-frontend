import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { ElementService } from 'app/shared/services/element.service';
import { LanguageService } from '../sitie/languages/language.service';
import { TemplatesDetailComponent } from './detail/detail.component';
import { TemplatesListComponent } from './list.component';
import { TemplateService } from './templates.service';

export default [
    {
        path: '',
        component: TemplatesListComponent,
        resolve: {
            templates: () =>
                inject(TemplateService).getAll({
                    page: 1,
                    limit: 10,
                    search: null,
                    status: true,
                }),
        },
    },
    {
        path: 'detail',
        component: TemplatesDetailComponent,
        resolve: {
            template: () =>
                inject(TemplateService).find(
                    inject(Router).getCurrentNavigation()?.extras?.state?.id
                ),
            languages: () =>
                inject(LanguageService).getAll({
                    limit: 99999,
                    page: 1,
                    search: null,
                    status: true,
                }),
            elements: () =>
                inject(ElementService).getAll({
                    limit: 99999,
                    page: 1,
                    search: null,
                    status: true,
                }),
        },
    },
] as Routes;
