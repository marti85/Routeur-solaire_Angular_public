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
