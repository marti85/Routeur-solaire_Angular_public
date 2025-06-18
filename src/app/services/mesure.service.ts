// src/app/services/mesure.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Mesure {
  id?: number;
  puissance_solaire: number;
  timestamp: string;
  routeur: number;
}

@Injectable({
  providedIn: 'root'
})
export class MesureService {
  private apiMesuresUrl = 'http://localhost:8000/api/mesures/';

  constructor(private http: HttpClient) { }

  getMesures(): Observable<Mesure[]> {
    return this.http.get<Mesure[]>(this.apiMesuresUrl).pipe(
      catchError(this.handleError)
    );
  }

  // >>>>>> Assurez-vous que cette méthode est définie comme ci-dessous <<<<<<
  public getMesuresByRouteur(routeurId: number): Observable<Mesure[]> { // <<<<<< Ajout de 'public' si manquant
    console.log('GetMesures');
    return this.http.get<Mesure[]>(`${this.apiMesuresUrl}?routeur_id=${routeurId}`).pipe(
      catchError(this.handleError)
    );
  }

//getMesuresByRouteur(routeurId: number): Observable<Mesure[]> {
//  const url = `<span class="math-inline">\{this\.apiMesuresUrl\}?routeur\_id\=</span>{routeurId}`;
//  console.log('MesureService: Fetching from URL:', url); // Log l'URL construite
//  return this.http.get<Mesure[]>(url).pipe(
//    catchError(this.handleError)
//  );
//}

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('MesureService: Une erreur est survenue:', error);
    let errorMessage = 'Une erreur inconnue est survenue lors de l\'opération sur les mesures !';
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
    return throwError(() => new Error(errorMessage));
  }
}
