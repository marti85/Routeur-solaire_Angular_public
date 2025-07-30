// src/app/auth/services/auth.service.ts
// services spécifiquement liés à l'authentification

// Importe les modules et classes nécessaires d'Angular et de RxJS.
import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; // Core Angular
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Pour les requêtes HTTP
import { Router } from '@angular/router'; // Pour la navigation entre les routes Angular
import { BehaviorSubject, Observable, throwError } from 'rxjs'; // RxJS : BehaviorSubject pour un état observable, Observable pour les flux de données, throwError pour propager les erreurs
import { tap, catchError } from 'rxjs/operators'; // RxJS Operators : tap pour les effets secondaires sans modifier le flux, catchError pour la gestion des erreurs
import { isPlatformBrowser } from '@angular/common'; // Pour vérifier si le code s'exécute côté navigateur (important pour localStorage)

// Décorateur @Injectable indique qu'il s'agit d'un service Angular qui peut être injecté.
// 'providedIn: 'root'' signifie que le service est disponible à l'échelle de l'application (singleton).
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL de base de l'API backend.
  private apiUrl = 'http://localhost:8000/api'; // Cette base URL est correcte, car les chemins '/token/', '/register/' etc.
                                                 // sont relatifs à '/api/' grâce à l'include de Django.

  // BehaviorSubject pour suivre l'état d'authentification de l'utilisateur.
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated$: Observable<boolean>;

  // BehaviorSubject pour stocker et observer le nom d'utilisateur de l'utilisateur connecté.
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

  /**
   * Gère la logique de connexion de l'utilisateur.
   * Envoie les identifiants au backend et stocke les jetons JWT en cas de succès.
   * @param {any} credentials - L'objet contenant le nom d'utilisateur et le mot de passe.
   * @returns {Observable<any>} Un Observable qui émet la réponse de l'API en cas de succès.
   */
  login(credentials: any): Observable<any> {
    console.log('AuthService: Attempting login with credentials:', credentials);
    // MISE À JOUR DE L'URL DE CONNEXION : de /auth/login/ à /token/
    return this.http.post<any>(`${this.apiUrl}/token/`, credentials).pipe( // <-- CHANGEMENT ICI
      tap(response => {
        if (response && response.access) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('access_token', response.access);
            if (response.refresh) { // Stocker le refresh token si présent
                localStorage.setItem('refresh_token', response.refresh); // <-- ACTIVÉ ICI
            }

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

  /**
   * Gère la déconnexion de l'utilisateur.
   * Supprime les jetons du localStorage et met à jour les états.
   */
  logout(): void {
    console.log('AuthService: Logging out.');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('username');
      localStorage.removeItem('refresh_token'); // <-- AJOUTÉ POUR SUPPRIMER LE REFRESH TOKEN
    }
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Gère la logique d'inscription de l'utilisateur.
   * Envoie les données d'inscription au backend.
   * @param {any} user - L'objet contenant les données de l'utilisateur pour l'inscription.
   * @returns {Observable<any>} Un Observable qui émet la réponse de l'API en cas de succès.
   */
  register(user: any): Observable<any> {
    console.log('AuthService: Attempting registration with user:', user);
    // MISE À JOUR DE L'URL D'INSCRIPTION : de /auth/register/ à /register/
    return this.http.post<any>(`${this.apiUrl}/register/`, user).pipe( // <-- CHANGEMENT ICI
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

  /**
   * Tente de rafraîchir le jeton d'accès en utilisant le jeton de rafraîchissement.
   * @returns {Observable<any>} Un Observable qui émet le nouvel access token ou une erreur.
   */
  refreshToken(): Observable<any> {
    // ACTIVATION COMPLÈTE DE LA LOGIQUE DE RAFRAÎCHISSEMENT
    if (!isPlatformBrowser(this.platformId)) {
      return throwError(() => new Error('Refresh token not available on server side'));
    }
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      this.logout(); // Déconnecte si aucun refresh token n'est trouvé.
      return throwError(() => new Error('No refresh token available'));
    }
    // MISE À JOUR DE L'URL DE RAFRAÎCHISSEMENT : de /auth/token/refresh/ à /token/refresh/
    return this.http.post(`${this.apiUrl}/token/refresh/`, { refresh: refresh_token }).pipe( // <-- CHANGEMENT ICI
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
          return this.handleError(error); // Gère les erreurs lors du rafraîchissement.
      })
    );
  }

  /**
   * Récupère le jeton d'accès stocké.
   * @returns {string | null} Le jeton d'accès ou null.
   */
  getAccessToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  /**
   * Récupère le jeton de rafraîchissement stocké.
   * @returns {string | null} Le jeton de rafraîchissement ou null.
   */
  getRefreshToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

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