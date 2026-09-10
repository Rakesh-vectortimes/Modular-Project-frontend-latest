import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';

const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/app-signup',
  '/auth/logout',
  '/auth/oauth/',
  '/published',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);

  const isPublic = PUBLIC_PATHS.some((path) => req.url.includes(path));
  const token = tokenStorage.getAccessToken();

  const authReq =
    !isPublic && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && !isPublic) {
        authService.handleUnauthorized();
      }
      return throwError(() => error);
    }),
  );
};
