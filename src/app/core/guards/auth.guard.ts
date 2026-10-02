import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '@core/services';
import { of, switchMap } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = () => {
  const router: Router = inject(Router);

  return inject(AuthService)
    .checkAuthStatus()
    .pipe(
      switchMap((authenticated) => {
        if (!authenticated) {
          const urlTree = router.createUrlTree(['/auth/sign-in']);
          return of(new RedirectCommand(urlTree));
        }
        return of(true);
      }),
    );
};
