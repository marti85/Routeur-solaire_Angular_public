// src/app/core/http/auth.interceptor.ts

// L'intercepteur HTTP permet d'ajouter automatiquement 
//  l'en-tête d'autorisation à toutes les requêtes sortantes vers l'API

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap, finalize } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service'; // Ajustez le chemin si nécessaire
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let authReq = request;
    const accessToken = isPlatformBrowser(this.platformId) ? localStorage.getItem('access_token') : null;

    // vérifie si un access_token existe dans le localStorage
    if (accessToken) {
      authReq = this.addToken(request, accessToken);  //Si un jeton est trouvé, il ajoute l'en-tête 
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && accessToken) { // Check if it's a 401 error and a token was present
          return this.handle401Error(authReq, next);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.authService.refreshToken().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token.access); // Ensure it's token.access
          return next.handle(this.addToken(request, token.access));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.authService.logout(); // Logout user if refresh fails
          return throwError(() => err);
        }),
        finalize(() => { // ensure isRefreshing is reset even on success
          this.isRefreshing = false;
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        switchMap((token) => {
          return next.handle(this.addToken(request, token));
        })
      );
    }
  }
}