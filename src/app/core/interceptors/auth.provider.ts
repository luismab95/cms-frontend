import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, inject, Provider, provideAppInitializer } from '@angular/core';
import { AuthService } from '@core/services';
import { authInterceptor } from './auth.interceptor';

/**
 * Provider Auth
 */
export const provideAuth = (): Array<Provider | EnvironmentProviders> => {
  return [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      inject(AuthService);
    }),
  ];
};
