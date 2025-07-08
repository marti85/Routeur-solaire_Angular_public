// src/app/services/appareil.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';


// Interfaces pour les données Appareil et Configuration
export interface Appareil {
  id?: number;
  nom: string;
  type: string;
  puissance_max: number;
  routeur: number; // ID du routeur auquel l'appareil est lié
  configuration?: Configuration; // Optionnel, pour inclure la config si elle est renvoyée par l'API
}

export interface Configuration {
  id?: number;
  appareil: number; // ID de l'appareil auquel la configuration est liée
  seuil_activation: number;
  plage_horaire_debut: string; // Format "HH:mm:ss" ou "HH:MM"
  plage_horaire_fin: string;   // Format "HH:mm:ss" ou "HH:MM"
}

@Injectable({
  providedIn: 'root'
})
export class AppareilService {
  private apiUrl = 'http://localhost:8000/api/appareils/'; // Adaptez l'URL de votre API Django
  private configUrl = 'http://localhost:8000/api/configurations/'; // URL pour les configurations

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getAccessToken();
    if (!token) {
      console.error('No authentication token found. Redirecting to login or handling error.');
      // Gérer le cas où le token est manquant, par ex. rediriger vers la page de connexion
      // Exemple: this.router.navigate(['/login']);
      return new HttpHeaders(); // Retourne un header vide ou lance une erreur
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`
    });
  }

  // --- Méthodes pour les Appareils ---
  getAppareilsByRouteur(routeurId: number): Observable<Appareil[]> {
    return this.http.get<Appareil[]>(`${this.apiUrl}?routeur=${routeurId}`, { headers: this.getAuthHeaders() });
  }

  createAppareil(appareil: Appareil): Observable<Appareil> {
    return this.http.post<Appareil>(this.apiUrl, appareil, { headers: this.getAuthHeaders() });
  }

  updateAppareil(id: number, appareil: Appareil): Observable<Appareil> {
    return this.http.put<Appareil>(`${this.apiUrl}${id}/`, appareil, { headers: this.getAuthHeaders() });
  }

  deleteAppareil(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}${id}/`, { headers: this.getAuthHeaders() });
  }

  // --- Méthodes pour la Configuration ---
  createConfiguration(config: Configuration): Observable<Configuration> {
    return this.http.post<Configuration>(this.configUrl, config, { headers: this.getAuthHeaders() });
  }

  updateConfiguration(id: number, config: Configuration): Observable<Configuration> {
    return this.http.put<Configuration>(`${this.configUrl}${id}/`, config, { headers: this.getAuthHeaders() });
  }

  // Cette méthode peut être utile si vous avez besoin d'une configuration par son ID (pas par appareil ID)
  // getConfiguration(id: number): Observable<Configuration> {
  //   return this.http.get<Configuration>(`${this.configUrl}${id}/`, { headers: this.getAuthHeaders() });
  // }
}
