// src/app/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Nécessaire pour ngFor, ngIf
import { FormsModule } from '@angular/forms'; // Nécessaire pour [(ngModel)]
import { RouterService, Routeur } from '../services/router.service'; // Importez le RouterService et l'interface Routeur
import { MesureService, Mesure } from '../services/mesure.service'; // Nous allons créer ce service
import { Chart, registerables , TooltipItem } from 'chart.js'; // Importez Chart et registerables pour les graphiques
import { Subscription } from 'rxjs';

Chart.register(...registerables); // Enregistrez tous les modules de Chart.js

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule], // Ajoutez FormsModule
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  routeurs: Routeur[] = []; // Liste de tous les routeurs de l'utilisateur
  selectedRouteurId: number | null = null; // ID du routeur sélectionné par l'utilisateur
  mesures: Mesure[] = []; // Mesures du routeur sélectionné
  errorMessage: string | null = null;

  // Pour Chart.js
  private chartInstance: Chart | null = null;
  private routerSubscription: Subscription | undefined;
  private mesureSubscription: Subscription | undefined;

  constructor(
    private routerService: RouterService,
    private mesureService: MesureService // Injectez le service de mesures
  ) {}

  ngOnInit(): void {
    this.loadRouteurs();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.mesureSubscription) {
      this.mesureSubscription.unsubscribe();
    }
    if (this.chartInstance) {
      this.chartInstance.destroy(); // Détruire l'instance du graphique lors de la destruction du composant
    }
  }

  loadRouteurs(): void {
    this.routerSubscription = this.routerService.getRouteurs().subscribe({
      next: (data) => {
        this.routeurs = data;
        if (this.routeurs.length > 0) {
          // Sélectionnez le premier routeur par défaut si aucun n'est sélectionné
          if (!this.selectedRouteurId) {
            this.selectedRouteurId = this.routeurs[0].id!; // Utilisez ! car l'id existe après chargement
          }
          this.onRouteurSelect(); // Chargez les mesures pour le routeur sélectionné par défaut
        }
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des routeurs: ' + err.message;
        console.error('Failed to load routers:', err);
      }
    });
  }

  onRouteurSelect(): void {
    if (this.selectedRouteurId) {
      this.loadMesuresForSelectedRouteur(this.selectedRouteurId);
    } else {
      this.mesures = [];
      if (this.chartInstance) {
        this.chartInstance.destroy(); // Détruire le graphique s'il n'y a pas de sélection
        this.chartInstance = null;
      }
    }
  }

  loadMesuresForSelectedRouteur(routeurId: number): void {
    this.mesureSubscription = this.mesureService.getMesuresByRouteur(routeurId).subscribe({
      next: (data) => {
        this.mesures = data;
        this.errorMessage = null;
        this.renderChart(); // Mettre à jour le graphique avec les nouvelles mesures
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des mesures: ' + err.message;
        console.error('Failed to load mesures:', err);
        this.mesures = []; // Vider les mesures en cas d'erreur
        if (this.chartInstance) {
            this.chartInstance.destroy(); // Détruire le graphique en cas d'erreur
            this.chartInstance = null;
        }
      }
    });
  }

  renderChart(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy(); // Détruire l'ancien graphique avant d'en créer un nouveau
    }

    const canvas = document.getElementById('mesuresChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error("Canvas element 'mesuresChart' not found!");
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Failed to get 2D context for canvas.");
        return;
    }

    const timestamps = this.mesures.map(m => new Date(m.timestamp).toLocaleString());
    const puissances = this.mesures.map(m => m.puissance_solaire);

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: 'Puissance solaire (W)',
          data: puissances,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Permet au graphique de s'adapter à la taille du parent
        scales: {
          x: {
            title: { display: true, text: 'Temps' },
            ticks: {
                maxRotation: 45,
                minRotation: 45
            }
          },
          y: {
            title: { display: true, text: 'Puissance (W)' },
            beginAtZero: true
          }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: (context: TooltipItem<"line">[]) => {
                        if (context.length > 0) {
                            const dataIndex = context[0].dataIndex;
                            if (this.mesures[dataIndex]) {
                                const date = new Date(this.mesures[dataIndex].timestamp);
                                return date.toLocaleString();
                            }
                        }
                        return ''; // Retourne une chaîne vide si aucune donnée valide
                    }
                }
            }
        }
      }
    });
  }
}