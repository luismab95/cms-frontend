import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services';
import { AuthUtils } from '@shared/utils';
import { Observable, catchError, throwError } from 'rxjs';

/**
 * Intercept
 * @param req
 * @param next
 */
export const authInterceptor = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  let newReq = req.clone();
  if (authService.accessToken && !AuthUtils.isTokenExpired(authService.accessToken)) {
    newReq = req.clone({
      headers: req.headers.set('Authorization', authService.accessToken),
    });
  }

  return next(newReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.signOut();
        location.reload();
      }
      return throwError(error);
    }),
  );
};
