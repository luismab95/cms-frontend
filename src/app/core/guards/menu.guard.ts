import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services';
import { of, switchMap } from 'rxjs';

export const MenuGuard: CanActivateFn | CanActivateChildFn = (_, state) => {
  const router: Router = inject(Router);
  return inject(AuthService)
    .checkNavigation(state)
    .pipe(
      switchMap((response) => {
        if (!response) {
          const urlTree = router.parseUrl(`admin/`);
          return of(urlTree);
        }
        return of(true);
      }),
    );
};
