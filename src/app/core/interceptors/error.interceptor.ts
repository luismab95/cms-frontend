import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { AuthService } from '@core/services';
import { StatusCodeE } from '@shared/interfaces';
import { Observable, catchError, throwError } from 'rxjs';

/**
 * Intercept
 * @param req
 * @param next
 */
export const errorInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const _authService = inject(AuthService);
  const _toastrService = inject(ToastrService);
  const _router = inject(Router);
  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse) {
        const status = error.status;
        switch (status) {
          case StatusCodeE.UNAUTHORIZED:
            _authService.signOut();
            _router.navigate(['/auth/sign-in']);
            _toastrService.error(
              'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
              'Sessión Expirada',
            );
            break;
        }
      }
      return throwError(() => error);
    }),
  );
};
