// src/app/auth/services/auth.service.ts
// services spécifiquement liés à l'authentification

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
// import { jwtDecode } from 'jwt-decode'; // <<< Supprimé : Plus besoin si pas de rôle

// export interface DecodedToken { ... } // <<< Supprimé : Plus besoin si pas de rôle

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api';
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;

  private currentUserSubject: BehaviorSubject<string | null>;
  public currentUser$: Observable<string | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    console.log('AuthService: Constructor called.');

    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
    this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    this.currentUserSubject = new BehaviorSubject<string | null>(this.getStoredUsername());
    this.currentUser$ = this.currentUserSubject.asObservable();

    console.log('AuthService: Initial username from storage:', this.currentUserSubject.value);
    console.log('AuthService: Initial isAuthenticated:', this.isAuthenticatedSubject.value);
  }

  private hasToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('access_token');
    }
    return false;
  }

  private getStoredUsername(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('username');
    }
    return null;
  }

  login(credentials: any): Observable<any> {
    console.log('AuthService: Attempting login with credentials:', credentials);
    return this.http.post<any>(`${this.apiUrl}/auth/login/`, credentials).pipe(
      tap(response => {
        if (response && response.access) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('access_token', response.access);
            // Si vous n'utilisez pas de refresh token pour l'instant, ne stockez pas response.refresh
            // if (response.refresh) {
            //     localStorage.setItem('refresh_token', response.refresh);
            // }

            const username = response.username || credentials.username;
            localStorage.setItem('username', username);

            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(username);

            console.log('AuthService: Jetons JWT et informations utilisateur stockés.');
            console.log('AuthService: Current username after login:', this.currentUserSubject.value);
          }
        }
      }),
      catchError(error => {
        console.error('AuthService: Login failed:', error);
        return throwError(() => new Error('Login failed.'));
      })
    );
  }

  logout(): void {
    console.log('AuthService: Logging out.');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('username');
      // localStorage.removeItem('refresh_token'); // <<< Supprimé si pas utilisé
    }
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  register(user: any): Observable<any> {
    console.log('AuthService: Attempting registration with user:', user);
    return this.http.post<any>(`${this.apiUrl}/auth/register/`, user).pipe(
      tap(response => {
        console.log('AuthService: Registration successful:', response);
      }),
      catchError(error => {
        console.error('AuthService: Registration failed:', error);
        return throwError(() => new Error('Registration failed.'));
      })
    );
  }

  public get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  refreshToken(): Observable<any> {
    // Si vous ne gérez pas le refresh token pour l'instant, cette méthode peut être simplifiée
    // ou ne pas être utilisée par l'intercepteur.
    // Pour l'instant, elle restera vide ou renverra une erreur pour indiquer qu'elle n'est pas implémentée.
    console.warn('AuthService: refreshToken not fully implemented or needed at this stage.');
    return throwError(() => new Error('Refresh token functionality not active.'));
    /*
    // Si vous voulez la laisser pour plus tard mais non fonctionnelle sans refresh_token stocké
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Refresh token not available on server side'));
    }
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post(`${this.apiUrl}/auth/token/refresh/`, { refresh: refresh_token }).pipe(
      tap((response: any) => {
        if (isPlatformBrowser(this.platformId) && response && response.access) {
          localStorage.setItem('access_token', response.access);
          if (response.refresh) {
            localStorage.setItem('refresh_token', response.refresh);
          }
          console.log('Jeton d\'accès rafraîchi.');
        }
      }),
      catchError(error => {
          return this.handleError(error);
      })
    );
    */
  }

  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  getRefreshToken(): string | null {
    // Si vous ne stockez pas le refresh token, cette méthode renverra toujours null
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  // public hasRole(role: string): boolean { ... } // <<< Supprimé : Plus besoin si pas de rôle

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('An error occurred:', error);
    let errorMessage = 'Une erreur inconnue est survenue !';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else if (error.error && typeof error.error === 'object') {
      errorMessage = 'Détails de l\'erreur :';
      for (const key in error.error) {
        if (error.error.hasOwnProperty(key)) {
          errorMessage += `\n${key}: ${Array.isArray(error.error[key]) ? error.error[key].join(', ') : error.error[key]}`;
        }
      }
    } else if (error.status) {
      errorMessage = `Erreur ${error.status}: ${error.statusText || ''}`;
      if (error.error) {
        errorMessage += `\n${JSON.stringify(error.error)}`;
      }
    } else {
      errorMessage = `Erreur réseau: ${error.message}`;
    }
    if (error.status === 401 || error.status === 403) {
        console.warn('AuthService: Unauthorized or Forbidden error.');
    }
    return throwError(() => new Error(errorMessage));
  }
}