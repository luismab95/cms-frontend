import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services';
import { of, switchMap } from 'rxjs';

export const NoAuthGuard: CanActivateFn | CanActivateChildFn = () => {
  const router: Router = inject(Router);

  return inject(AuthService)
    .checkAuthStatus()
    .pipe(
      switchMap((authenticated) => {
        if (authenticated) return of(router.parseUrl(''));
        return of(true);
      }),
    );
};
