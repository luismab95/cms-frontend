import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { LuxonDateAdapter } from '@angular/material-luxon-adapter';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
    provideRouter,
    withInMemoryScrolling,
    withRouterConfig,
} from '@angular/router';
import { provideFuse } from '@fuse';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { appRoutes } from 'app/app.routes';
import { provideAuth } from 'app/core/auth/auth.provider';
import { provideIcons } from 'app/core/icons/icons.provider';
import { MockApiService } from 'app/mock-api';
import {
    MonacoEditorModule,
    NgxMonacoEditorConfig,
} from 'ngx-monaco-editor-v2';
import { provideToastr } from 'ngx-toastr';

export const monacoConfig: NgxMonacoEditorConfig = {
    baseUrl: window.location.origin + '/assets/monaco/min/vs',
};

export const appConfig: ApplicationConfig = {
    providers: [
        importProvidersFrom(MonacoEditorModule.forRoot(monacoConfig)),
        importProvidersFrom(FormlyModule.forRoot()),
        importProvidersFrom(FormlyMaterialModule),
        provideAnimations(),
        provideHttpClient(withFetch()),
        provideToastr({
            timeOut: 5000,
            positionClass: 'toast-top-right',
            preventDuplicates: true,
            progressBar: true,
            closeButton: true,
        }),
        provideRouter(
            appRoutes,
            withRouterConfig({ onSameUrlNavigation: 'reload' }),
            withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
        ),

        // Material Date Adapter
        {
            provide: DateAdapter,
            useClass: LuxonDateAdapter,
        },
        {
            provide: MAT_DATE_FORMATS,
            useValue: {
                parse: {
                    dateInput: 'D',
                },
                display: {
                    dateInput: 'DDD',
                    monthYearLabel: 'LLL yyyy',
                    dateA11yLabel: 'DD',
                    monthYearA11yLabel: 'LLLL yyyy',
                },
            },
        },

        // Fuse
        provideAuth(),
        provideIcons(),
        provideFuse({
            mockApi: {
                delay: 0,
                service: MockApiService,
            },
            fuse: {
                layout: 'classy',
                scheme: 'light',
                screens: {
                    sm: '600px',
                    md: '960px',
                    lg: '1280px',
                    xl: '1440px',
                },
                theme: 'theme-default',
                themes: [
                    {
                        id: 'theme-default',
                        name: 'Default',
                    },
                    {
                        id: 'theme-brand',
                        name: 'Brand',
                    },
                    {
                        id: 'theme-teal',
                        name: 'Teal',
                    },
                    {
                        id: 'theme-rose',
                        name: 'Rose',
                    },
                    {
                        id: 'theme-purple',
                        name: 'Purple',
                    },
                    {
                        id: 'theme-amber',
                        name: 'Amber',
                    },
                ],
            },
        }),
    ],
};
