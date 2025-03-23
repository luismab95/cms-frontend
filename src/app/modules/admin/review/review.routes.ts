import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { LanguageService } from 'app/shared/services/language.service';
import { PagesReviewPageComponent } from './review-page/review-page.component';
import { ReviewListComponent } from './list.component';
import { ReviewPageService } from './review.service';

export default [
    {
        path: '',
        component: ReviewListComponent,
        resolve: {
            pages: () =>
                inject(ReviewPageService).getAll({
                    limit: 10,
                    page: 1,
                    search: null,
                    status: true,
                }),
        },
    },

    {
        path: 'detail',
        component: PagesReviewPageComponent,
        resolve: {
            page: () =>
                inject(ReviewPageService).find(
                    inject(Router).getCurrentNavigation()?.extras?.state?.id
                ),
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
