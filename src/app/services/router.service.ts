// src/app/services/router.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
// Pas besoin d'importer AuthService ici, l'URL est fixée.
// import { AuthService } from '../auth/services/auth.service';

// Interface pour le type de routeur (correspond à votre modèle RouteurType Django)
export interface RouteurType {
  id: number;
  nom_type: string;
}

// Interface pour un routeur (correspond à votre modèle Routeur Django et son Serializer)
export interface Routeur {
  id?: number; // Optionnel pour la création (sera généré par Django)
  nom: string;
  type: number; // ID du RouteurType (ForeignKey)
  identifiant: string; // UUID
  code_securite?: string; // Optionnel pour l'édition, requis pour la création
  user?: number; // ID de l'utilisateur (sera défini par le backend)
  user_username?: string; // Nom d'utilisateur du propriétaire (lecture seule du sérialiseur)
  type_nom?: string; // Nom du type de routeur (lecture seule du sérialiseur)
  // Ajoutez d'autres champs si votre modèle Routeur en a
}

@Injectable({
  providedIn: 'root'
})
export class RouterService {
  // Ajustez l'URL pour qu'elle pointe vers votre API Django des routeurs
  private apiRoutersUrl = 'http://localhost:8000/api/routeurs/';
  private apiRouterTypesUrl = 'http://localhost:8000/api/router-types/'; // Pour récupérer les types

  constructor(private http: HttpClient) { } // Retiré authService car non directement utilisé pour l'URL ici

  // --- Méthodes pour les Routeurs ---

  getRouteurs(): Observable<Routeur[]> {
    return this.http.get<Routeur[]>(this.apiRoutersUrl).pipe(
      catchError(this.handleError)
    );
  }

  getRouteur(id: number): Observable<Routeur> {
    return this.http.get<Routeur>(`${this.apiRoutersUrl}${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  addRouteur(routeur: Routeur): Observable<Routeur> {
    // Le backend définit 'user', 'user_username', 'type_nom', 'id' automatiquement
    // et 'code_securite' est 'write_only', on peut donc envoyer un objet 'propre'
    const { user, user_username, type_nom, id, ...dataToSend } = routeur;
    return this.http.post<Routeur>(this.apiRoutersUrl, dataToSend).pipe(
      catchError(this.handleError)
    );
  }

  updateRouteur(id: number, routeur: Routeur): Observable<Routeur> {
    // Lors de la mise à jour, on n'envoie pas user, user_username, type_nom, id.
    // code_securite n'est généralement pas mis à jour via ce formulaire.
    const { user, user_username, type_nom, id: routerId, code_securite, ...dataToSend } = routeur;
    return this.http.put<Routeur>(`${this.apiRoutersUrl}${id}/`, dataToSend).pipe(
      catchError(this.handleError)
    );
  }

  deleteRouteur(id: number): Observable<any> {
    return this.http.delete(`${this.apiRoutersUrl}${id}/`).pipe(
      catchError(this.handleError)
    );
  }

  // --- Méthodes pour les Types de Routeurs ---
  getRouteurTypes(): Observable<RouteurType[]> {
    return this.http.get<RouteurType[]>(this.apiRouterTypesUrl).pipe(
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
      errorMessage = 'Détails de l\'erreur :';
      for (const key in error.error) {
        if (error.error.hasOwnProperty(key)) {
          errorMessage += `\n${key}: ${Array.isArray(error.error[key]) ? error.error[key].join(', ') : error.error[key]}`;
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