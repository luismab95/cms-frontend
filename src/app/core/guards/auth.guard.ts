import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { of, switchMap } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = () => {
  const router: Router = inject(Router);

  // Check the authentication status
  return inject(AuthService)
    .check()
    .pipe(
      switchMap((authenticated) => {
        // If the user is not authenticated...
        if (!authenticated) {
          // Redirect to the sign-in page with a redirectUrl param
          const urlTree = router.createUrlTree(['/auth/sign-in']);
          return of(new RedirectCommand(urlTree));
        }

        // Allow the access
        return of(true);
      }),
    );
};
