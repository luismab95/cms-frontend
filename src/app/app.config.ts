import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { ApplicationConfig, provideAppInitializer, inject, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter, withRouterConfig, withInMemoryScrolling } from "@angular/router";
import { provideToastr } from "@iqx-limited/ngx-toastr";
import { provideDynamicForm } from "@ng-forge/dynamic-forms";
import { provideMonacoEditor } from "ngx-monaco-editor-v2";
import { loaderInterceptor, provideAuth } from "@core/interceptors";
import { InitializerService } from "@core/services";
import { withTailwindFields } from "@shared/components/dynamic-form/fields";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const initializerService = inject(InitializerService);
      return initializerService.find();
    }),
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
