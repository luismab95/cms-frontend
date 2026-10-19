import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { LoaderService } from '@core/services';
import { finalize } from 'rxjs';

let countRequest = 0;

/**
 * Loader interceptor
 * @param req
 * @param next
 * @returns
 */
export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  if (req.url.toLowerCase().includes('plugin')) return next(req);

  if (!countRequest) loaderService.setIsloading(true);

  countRequest++;
  return next(req).pipe(
    finalize(() => {
      countRequest--;
      if (!countRequest) {
        loaderService.setIsloading(false);
      }
    }),
  );
};
