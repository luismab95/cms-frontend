import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideDynamicForm } from '@ng-forge/dynamic-forms';
import { provideToastr } from '@iqx-limited/ngx-toastr';
import { routes } from './app.routes';
import { provideAuth } from './core/interceptors/auth.provider';
import { loaderInterceptor } from './core/interceptors/loader.interceptor';
import { withTailwindFields } from './shared/components/dynamic-form/fields';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideToastr({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
      closeButton: true,
    }),
    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withInterceptors([loaderInterceptor])),
    provideAuth(),
    provideDynamicForm(...withTailwindFields()),
    provideMonacoEditor(),
  ],
};
