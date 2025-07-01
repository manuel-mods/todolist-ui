import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Skip auth header for auth endpoints
  if (req.url.includes('/auth/')) {
    return next(req);
  }
  
  // Only add auth header for API requests
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  
  // Get Firebase ID token asynchronously
  return from(authService.getIdToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }
      
      return next(req);
    })
  );
};