// src/app/services/mesure.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interface pour les mesures brutes (correspondant au MesureSerializer de Django)
export interface Mesure {
  id?: number;
  puissance_solaire: number | null; // Peut être null si non disponible
  puissance_soutiree: number | null; // Peut être null si non disponible
  ouverture_triac?: number | null; // Optionnel et peut être null
  timestamp: string; // Ex: "2023-10-26T10:00:00Z"
  routeur: number;
}

// Interface pour les mesures agrégées journalières (Backend: MesureAgregeeSerializer ou équivalent pour 'day')
// C'est le type que vous recevrez quand vous demanderez 'period=day' sur mesures-agregees
export interface MesureAgregeeDaily {
  id?: number; // L'ID peut ne pas être pertinent pour une agrégation
  routeur: number;
  date: string; // Date de l'agrégation, ex: "2023-10-26"
  puissance_solaire_moyenne: number | null;
  puissance_soutiree_moyenne: number | null;
  ouverture_triac_moyenne: number | null;
  nombre_mesures: number; // Nombre de mesures agrégées
}

// Interface pour les mesures agrégées horaires (si votre backend envoie ceci, ex: pour 'hour')
export interface MesureAgregeeHourly {
  id?: number;
  routeur: number;
  timestamp_interval_start: string; // Début de l'intervalle horaire, ex: "2023-10-26T10:00:00Z"
  puissance_solaire_moyenne: number | null;
  puissance_soutiree_moyenne: number | null;
  ouverture_triac_moyenne: number | null;
  nombre_mesures: number;
}

// Interface pour les agrégations mensuelles/annuelles (Backend: MonthlyAgregeeSerializer / YearlyAgregeeSerializer)
// C'est le type que vous recevrez quand vous demanderez 'period=month' ou 'period=year' sur mesures-agregees
export interface MesureAgregeeMonthlyYearly {
    timestamp: string; // Ex: "2023-10-01T00:00:00Z" pour une agrégation mensuelle
    routeur_id: number; // Ou simplement 'routeur' selon votre backend
    puissance_solaire_moyenne: number | null;
    puissance_soutiree_moyenne: number | null;
    ouverture_triac_moyenne: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class MesureService {
  // URLs hardcodées car le dossier 'environments' est absent
  private apiBaseUrl = 'http://localhost:8000/api';
  private apiMesuresUrl = `${this.apiBaseUrl}/mesures/`;
  private apiAgregeeMesuresUrl = `${this.apiBaseUrl}/mesures-agregees/`;

  constructor(private http: HttpClient) { }

  getMesures(): Observable<Mesure[]> {
    return this.http.get<Mesure[]>(this.apiMesuresUrl).pipe(
      catchError(this.handleError)
    );
  }

  // Méthode pour les mesures brutes (pour la vue 'day' du frontend)
  public getMesuresByRouteur(
    routeurId: number,
    startDate?: string, // Format 'YYYY-MM-DD'
    endDate?: string    // Format 'YYYY-MM-DD'
  ): Observable<Mesure[]> {
    console.log('MesureService: Requête pour mesures brutes, routeur ID:', routeurId, 'startDate:', startDate, 'endDate:', endDate);

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

  // Méthode pour les mesures agrégées (pour les vues 'month' et 'year' du frontend)
  public getMesuresAgregeesByRouteur(
    routeerId: number, // <<-- Renommé en routeerId pour éviter le conflit avec le paramètre routeur dans l'URL (si nécessaire)
    startDate?: string,
    endDate?: string,
    // Le 'period' ici indique le niveau d'agrégation demandé au backend (ex: 'day' pour un mois)
    period?: 'day' | 'month' | 'year'
  ): Observable<(MesureAgregeeDaily | MesureAgregeeMonthlyYearly | MesureAgregeeHourly)[]> {
    console.log('MesureService: Requête pour mesures agrégées, routeur ID:', routeerId, 'startDate:', startDate, 'endDate:', endDate, 'period:', period);

    let params = new HttpParams();
    // Utilisez 'routeur_id' ou 'routeur' selon ce que votre backend attend pour les agrégées
    // Selon l'image des erreurs backend (e506c3.png), il semble que "routeur" soit attendu pour l'authentification.
    // Mais pour les requêtes GET sur les agrégées, 'routeur_id' est commun. Je le laisse ainsi pour le moment.
    params = params.append('routeur_id', routeerId.toString());

    if (startDate) {
      params = params.append('start_date', startDate);
    }
    if (endDate) {
      params = params.append('end_date', endDate);
    }
    if (period) {
        params = params.append('period', period);
    }

    return this.http.get<(MesureAgregeeDaily | MesureAgregeeMonthlyYearly | MesureAgregeeHourly)[]>(this.apiAgregeeMesuresUrl, { params: params }).pipe(
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
          // Correction de la faute de frappe ici : Array.isArray(error.error[key])
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
    // La fonction doit toujours retourner quelque chose, donc throwError est correct
    return throwError(() => new Error(errorMessage));
  }
}