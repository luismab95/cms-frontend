import { inject } from '@angular/core';
import { Routes } from '@angular/router';
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
    },
] as Routes;
