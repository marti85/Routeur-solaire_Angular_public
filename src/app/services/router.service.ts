// src/app/services/router.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http'; // Importez HttpHeaders
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Appareil } from './appareil.service';
import { AuthService } from '../auth/services/auth.service'; // Gardez l'importation de AuthService

// Interface pour le type de routeur (correspond à votre modèle RouteurType Django)
export interface RouteurType {
  id: number;
  nom_type: string;
}

// Interface pour un routeur (correspond à votre modèle Routeur Django et son Serializer)
export interface Routeur {
  id?: number; // Optionnel pour la création (sera généré par Django)
  nom: string;
  identifiant: string; // UUID
  nom_type?: string; // ID du RouteurType (ForeignKey)
  code_securite?: string; // Optionnel pour l'édition, requis pour la création
  user?: number; // ID de l'utilisateur (sera défini par le backend)
  user_username?: string; // Nom d'utilisateur du propriétaire (lecture seule du sérialiseur)
  // Ajout des champs pour le test de connexion et les appareils
  last_connection_test?: string; // Date/heure du dernier test
  last_connection_status?: 'SUCCESS' | 'FAILURE' | 'N/A'; // Statut du dernier test
  appareils?: Appareil[]; // Liste des appareils liés à ce routeur
}

@Injectable({
  providedIn: 'root'
})
export class RouterService {
  // Ajustez l'URL pour qu'elle pointe vers votre API Django des routeurs
  private apiRoutersUrl = 'http://localhost:8000/api/routeurs/';
  private apiRouterTypesUrl = 'http://localhost:8000/api/router-types/'; // Pour récupérer les types

  constructor(private http: HttpClient, private authService: AuthService) { } // Injectez AuthService

  // Méthode pour obtenir les headers d'authentification
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken(); // Appel à la méthode getToken() de AuthService
    if (!token) {
      console.error('No authentication token found. User might not be logged in.');
      // Vous pourriez vouloir rediriger l'utilisateur vers la page de connexion ici
      // ou lancer une erreur spécifique.
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    });
  }

  // Méthodes pour les Routeurs 

  getRouteurs(): Observable<Routeur[]> {
    // Utiliser les headers d'authentification
    return this.http.get<Routeur[]>(this.apiRoutersUrl, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getRouteur(id: number): Observable<Routeur> {
    return this.http.get<Routeur>(`${this.apiRoutersUrl}${id}/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  addRouteur(routeur: Routeur): Observable<Routeur> {
    // Le backend définit 'user', 'user_username', 'id' automatiquement
    // 'code_securite' est 'write_only', on peut donc envoyer un objet 'propre'
    // type_de_routeur est l'ID du type de routeur, pas le nom
    const { user, user_username, id, appareils, last_connection_test, last_connection_status, ...dataToSend } = routeur;
    return this.http.post<Routeur>(this.apiRoutersUrl, dataToSend, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  updateRouteur(id: number, routeur: Routeur): Observable<Routeur> {
    // Lors de la mise à jour, on n'envoie pas user, user_username, id, appareils.
    const { user, user_username, id: routerId, code_securite, appareils, last_connection_test, last_connection_status, ...dataToSend } = routeur;
    return this.http.put<Routeur>(`${this.apiRoutersUrl}${id}/`, dataToSend, { headers: this.getAuthHeaders() }).pipe(catchError(this.handleError));
  }

  deleteRouteur(id: number): Observable<any> {
    return this.http.delete(`${this.apiRoutersUrl}${id}/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // Nouvelle méthode pour le test de connexion
  performConnectionTest(id: number): Observable<any> {
    return this.http.post(`${this.apiRoutersUrl}${id}/test_connexion/`, {}, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode pour tester une nouvelle connexion (utilisée pour l'ajout de routeur)
  testNewConnection(identifiant: string, code_securite: string): Observable<any> {
    return this.http.post(`${this.apiRoutersUrl}test-new-connexion/`, { identifiant, code_securite }, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // --- Méthodes pour les Types de Routeurs ---
  getRouteurTypes(): Observable<RouteurType[]> {
    return this.http.get<RouteurType[]>(this.apiRouterTypesUrl, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  // --- Gestion des erreurs ---
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('RouterService: Une erreur est survenue:', error);
    let errorMessage = 'Une erreur inconnue est survenue lors de l\'opération sur le routeur !';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client ou réseau
      errorMessage = `Erreur: ${error.error.message}`;
    } else if (error.error && typeof error.error === 'object') {
      // Erreur retournée par le serveur (ex: validation)
      // Tenter d'extraire un message d'erreur plus spécifique
      if (error.error.detail) {
        errorMessage = `Erreur: ${error.error.detail}`;
      } else {
        errorMessage = 'Détails de l\'erreur :';
        for (const key in error.error) {
          if (error.error.hasOwnProperty(key)) {
            errorMessage += `\n${key}: ${Array.isArray(error.error[key]) ? error.error[key].join(', ') : error.error[key]}`;
          }
        }
      }
    } else if (error.status) {
      // Erreur HTTP (400, 401, 404, 500, etc.)
      errorMessage = `Erreur ${error.status}: ${error.statusText || ''}`;
      if (error.error) {
        errorMessage += `\n${JSON.stringify(error.error)}`;
      }
    } else {
      // Autre type d'erreur
      errorMessage = `Erreur réseau: ${error.message}`;
    }
    // Utilisez throwError pour renvoyer une erreur observable
    return throwError(() => new Error(errorMessage));
  }
}