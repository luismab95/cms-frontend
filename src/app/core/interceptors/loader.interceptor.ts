import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { LoaderService } from '../services/loader.service';
import { finalize } from 'rxjs';

let countRequest = 0;

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loaderService = inject(LoaderService);

  // No mostrar loader para URLs que contengan "plugin"
  if (req.url.toLowerCase().includes('plugin')) {
    return next(req);
  }

  if (!countRequest) {
    loaderService.setIsloading(true);
  }

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
