import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { of, switchMap } from 'rxjs';

export const MenuGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);

    // Check the authentication status
    return inject(AuthService)
        .checkMenu(state)
        .pipe(
            switchMap((response) => {
                // If the user is not authenticated...
                if (!response) {
                    // Redirect to the home page
                    const urlTree = router.parseUrl(`admin/`);
                    return of(urlTree);
                }

                // Allow the access
                return of(true);
            })
        );
};
