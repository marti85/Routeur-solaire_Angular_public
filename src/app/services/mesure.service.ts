// src/app/services/mesure.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Mesure {
  id?: number;
  puissance_solaire: number;
  puissance_soutiree: number;
  timestamp: string;
  routeur: number;
}

export interface AgregeeMesure { // Interface pour les mesures agrégées
  id?: number;
  routeur: number;
  date_heure_debut: string; // Début de la période agrégée
  date_heure_fin: string;   // Fin de la période agrégée (optionnel si le backend n'envoie que debut)
  puissance_solaire_moyenne: number; // Puissance solaire agrégée (ex: moyenne)
  puissance_soutiree_moyenne: number; // Puissance soutirée agrégée (ex: moyenne)
  // Ajoutez d'autres champs agrégés si votre API les fournit (ex: puissance_solaire_totale)
}

@Injectable({
  providedIn: 'root'
})
export class MesureService {
  private apiMesuresUrl = 'http://localhost:8000/api/mesures/';
  private apiAgregeeMesuresUrl = 'http://localhost:8000/api/mesures-agregees/';

  constructor(private http: HttpClient) { }

  getMesures(): Observable<Mesure[]> {
    return this.http.get<Mesure[]>(this.apiMesuresUrl).pipe(
      catchError(this.handleError)
    );
  }

  public getMesuresByRouteur(
    routeurId: number,
    startDate?: string, // Format 'YYYY-MM-DD'
    endDate?: string    // Format 'YYYY-MM-DD'
  ): Observable<Mesure[]> {
    console.log('MesureService: Requête pour mesures, routeur ID:', routeurId, 'startDate:', startDate, 'endDate:', endDate);

    let params = new HttpParams();
    params = params.append('routeur', routeurId.toString());

    if (startDate) {
      params = params.append('start_date', startDate);
    }
    if (endDate) {
      params = params.append('end_date', endDate);
    }

    return this.http.get<Mesure[]>(this.apiMesuresUrl, { params: params }).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode pour les mesures agrégées
  public getMesuresAgregeesByRouteur(
    routeurId: number,
    startDate?: string,
    endDate?: string,
    period?: 'day' | 'month' | 'year' // Pour envoyer au backend le niveau d'agrégation souhaité
  ): Observable<AgregeeMesure[]> {
    console.log('MesureService: Requête pour mesures agrégées, routeur ID:', routeurId, 'startDate:', startDate, 'endDate:', endDate, 'period:', period);

    let params = new HttpParams();
    params = params.append('routeur', routeurId.toString());

    if (startDate) {
      params = params.append('start_date', startDate);
    }
    if (endDate) {
      params = params.append('end_date', endDate);
    }
    if (period) {
        params = params.append('period', period); // Le backend utilisera ceci pour savoir comment agréger
    }

    return this.http.get<AgregeeMesure[]>(this.apiAgregeeMesuresUrl, { params: params }).pipe(
      catchError(this.handleError)
    );
  }


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
