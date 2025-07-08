// src/app/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Nécessaire pour ngFor, ngIf
import { FormsModule } from '@angular/forms'; // Nécessaire pour [(ngModel)]
import { RouterService, Routeur } from '../services/router.service'; // Importez le RouterService et l'interface Routeur
import { MesureService, Mesure } from '../services/mesure.service'; // Nous allons créer ce service
import { Chart, registerables , TooltipItem } from 'chart.js'; // Importez Chart et registerables pour les graphiques
import { Subscription } from 'rxjs';

// Importez Chart.js pour le 'time' adapter
import 'chartjs-adapter-date-fns';

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
  selectedDate: string = ''; // Format 'YYYY-MM-DD'
  selectedPeriod: 'day' | 'month' | 'year' = 'day';

  // Pour Chart.js
  private chartInstance: Chart | null = null;
  private routerSubscription: Subscription | undefined;
  //private mesureSubscription: any; // Pour gérer la désinscription
  private mesureSubscription: Subscription | undefined;

  constructor(
    private routerService: RouterService,
    private mesureService: MesureService // Injectez le service de mesures
  ) {}

  ngOnInit(): void {
    console.log('DashboardComponent: ngOnInit - Démarrage du composant.');
    this.selectedDate = this.getTodayDateString(); // Initialise à aujourd'hui
    //console.log('Date :', this.selectedDate );
    this.loadRouteurs();
  }

  ngOnDestroy(): void {
    console.log('DashboardComponent: ngOnDestroy - Destruction du composant.');
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      console.log('DashboardComponent: routerSubscription désabonné.');
    }
    if (this.mesureSubscription) {
      this.mesureSubscription.unsubscribe();
      console.log('DashboardComponent: mesureSubscription désabonné.');
    }
    if (this.chartInstance) {
      this.chartInstance.destroy(); // Détruire l'instance du graphique lors de la destruction du composant
      console.log('DashboardComponent: Graphique détruit.');
    }
  }

  private getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadRouteurs(): void {
    console.log('DashboardComponent: Chargement des routeurs...');
    this.routerSubscription = this.routerService.getRouteurs().subscribe({
      next: (data) => {
        console.log('DashboardComponent: Routeurs reçus :', data); 
        this.routeurs = data;
        if (this.routeurs.length > 0) {
          // Sélectionnez le premier routeur par défaut si aucun n'est sélectionné
          console.log('DashboardComponent: Au moins un routeur disponible.');
          if (!this.selectedRouteurId) {
            this.selectedRouteurId = this.routeurs[0].id!; // Utilisez ! car l'id existe après chargement
            console.log('DashboardComponent: Aucun routeur sélectionné, sélection du premier par défaut :', this.selectedRouteurId);
          }
          this.onSelectionChange(); // Chargez les mesures pour le routeur sélectionné par défaut
        }else {
          console.log('DashboardComponent: Aucun routeur trouvé.');
          this.selectedRouteurId = null; // S'il n'y a pas de routeurs, rien ne doit être sélectionné
        }
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des routeurs: ' + err.message;
        console.error('Failed to load routers:', err);
      }
    });
  }

  

  // >>>>>> Cette méthode remplace onRouteurSelect() et onDateSelect() <<<<<<
  // Elle est appelée chaque fois que le routeur, la date ou la période change.
  onSelectionChange(): void {
    console.log('DashboardComponent: onSelectionChange appelé. Routeur ID:', this.selectedRouteurId, 'Date:', this.selectedDate, 'Période:', this.selectedPeriod);
    if (this.selectedRouteurId && this.selectedDate) {
      // Calculer startDate et endDate en fonction de selectedDate et selectedPeriod
      let startDate: string | undefined;
      let endDate: string | undefined;

      const baseDate = new Date(this.selectedDate); // Utilisez l'objet Date pour les calculs

      if (this.selectedPeriod === 'day') {
        startDate = this.selectedDate; // Début du jour au format 'YYYY-MM-DD'
        const nextDay = new Date(baseDate);
        nextDay.setDate(baseDate.getDate() + 1);
        endDate = nextDay.toISOString().split('T')[0]; // Début du jour suivant au format 'YYYY-MM-DD'
      } else if (this.selectedPeriod === 'month') {
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).toISOString().split('T')[0]; // Premier jour du mois
        const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
        endDate = nextMonth.toISOString().split('T')[0]; // Premier jour du mois suivant
      } else if (this.selectedPeriod === 'year') {
        startDate = new Date(baseDate.getFullYear(), 0, 1).toISOString().split('T')[0]; // Premier jour de l'année
        const nextYear = new Date(baseDate.getFullYear() + 1, 0, 1);
        endDate = nextYear.toISOString().split('T')[0]; // Premier jour de l'année suivante
      }

      // Appeler loadMesuresForSelectedRouteur avec les dates calculées
      this.loadMesuresForSelectedRouteur(this.selectedRouteurId, startDate, endDate);
    } else {
      this.mesures = [];
      console.log('DashboardComponent: Sélection incomplète (routeur ou date), mesures vidées.');
      if (this.chartInstance) {
        this.chartInstance.destroy(); // Détruit le graphique si la sélection est incomplète
        this.chartInstance = null;
      }
    }
  }

  // Cette méthode est maintenant appelée par onSelectionChange() avec les dates calculées
  loadMesuresForSelectedRouteur(routeurId: number, startDate?: string, endDate?: string): void {
    console.log('DashboardComponent: Chargement des mesures pour routeur ID:', routeurId, 'de', startDate, 'à', endDate);

    if (this.mesureSubscription) {
        this.mesureSubscription.unsubscribe();
        console.log('DashboardComponent: Ancienne mesureSubscription désabonnée.');
    }

    this.mesureSubscription = this.mesureService.getMesuresByRouteur(routeurId, startDate, endDate).subscribe({
      next: (data) => {
        console.log('DashboardComponent: Mesures reçues du service pour ID', routeurId, ':', data);
        this.mesures = data; // Met à jour les mesures
        this.errorMessage = null;

        if (this.mesures.length > 0) {
          console.log('DashboardComponent: Mesures disponibles, affichage du graphique...');
          setTimeout(() => {
            this.renderChart(); // Redessine le graphique avec les NOUVELLES données
          }, 0);
        } else {
          console.log('DashboardComponent: Aucune mesure reçue pour le routeur sélectionné (ID', routeurId, ') ou la période donnée.');
          if (this.chartInstance) {
            this.chartInstance.destroy(); // Détruit l'ancien graphique
            this.chartInstance = null;
          }
        }
      },
      error: (err) => {
        console.error('DashboardComponent: Erreur lors du chargement des mesures pour ID', routeurId, ':', err);
        this.errorMessage = 'Erreur lors du chargement des mesures: ' + err.message;
        this.mesures = []; // Vide les mesures en cas d'erreur
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
      }
    });
  }

  renderChart(): void {
    console.log('DashboardComponent: Tentative de rendu du graphique...');
    if (this.chartInstance) {
      this.chartInstance.destroy(); // Détruire l'ancien graphique avant d'en créer un nouveau
      console.log('DashboardComponent: Ancien graphique détruit avant nouveau rendu.');
    }

    const canvas = document.getElementById('mesuresChart') as HTMLCanvasElement;
    if (!canvas) {
      console.error("DashboardComponent: Erreur - Élément canvas avec l'ID 'mesuresChart' non trouvé!");
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("DashboardComponent: Erreur - Impossible d'obtenir le contexte 2D pour le canvas.");
        return;
    }

    // Convertir les timestamps en objets Date pour Chart.js
    const timestamps = this.mesures.map(m => new Date(m.timestamp));
    const puissancesSolaires = this.mesures.map(m => m.puissance_solaire);
    const puissancesSoutirees = this.mesures.map(m => m.puissance_soutiree);

    console.log('DashboardComponent: Données pour le graphique - Timestamps (Dates):', timestamps);
    console.log('DashboardComponent: Données pour le graphique - Puissances Solaires:', puissancesSolaires);
    console.log('DashboardComponent: Données pour le graphique - Puissances Soutirées:', puissancesSoutirees); 

    if (timestamps.length === 0) {
        console.warn('DashboardComponent: Les données de timestamp ou de puissance sont vides, le graphique ne sera pas rendu.');
        return;
    }

    // Déterminer l'unité de l'axe X et le format d'affichage en fonction de la période sélectionnée
    let unit: 'hour' | 'day' | 'month' | 'year';
    let displayFormat: { [key: string]: string };
    let tooltipFormat: string;
    let xAxisTitle: string;

    if (this.selectedPeriod === 'day') {
      unit = 'hour';
      displayFormat = { hour: 'HH:mm', minute: 'HH:mm' };
      tooltipFormat = 'yyyy-MM-dd HH:mm:ss'; // Format complet pour le jour
      xAxisTitle = 'Heure de la journée';
    } else if (this.selectedPeriod === 'month') {
      unit = 'day';
      displayFormat = { day: 'MMM dd' }; // Ex: Juil 01
      tooltipFormat = 'MMM dd, yyyy HH:mm'; // Format jour/heure pour le mois
      xAxisTitle = 'Jour du mois';
    } else { // 'year'
      unit = 'month';
      displayFormat = { month: 'MMM yyyy' }; // Ex: Jan 2025
      tooltipFormat = 'MMM yyyy'; // Format mois/année pour l'année
      xAxisTitle = 'Mois de l\'année';
    }

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [
          {
            label: 'Puissance solaire (W)',
            data: puissancesSolaires,
            borderColor: 'rgb(75, 192, 192)', // Couleur bleue/verte pour le solaire
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y' // Assurez-vous que les deux datasets utilisent le même axe Y
          },
          { // <-- Nouveau dataset pour puissance_soutiree
            label: 'Puissance soutirée (W)',
            data: puissancesSoutirees,
            borderColor: 'rgb(255, 99, 132)', // Couleur rouge pour le soutiré
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false, // Généralement pas de remplissage pour la deuxième courbe
            tension: 0.3,
            yAxisID: 'y' // Assurez-vous que les deux datasets utilisent le même axe Y
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: unit,
              displayFormats: displayFormat,
              tooltipFormat: tooltipFormat,
            },
            title: { display: true, text: xAxisTitle },
            ticks: {
                maxRotation: 0,
                minRotation: 0,
                autoSkipPadding: 10,
                source: 'auto'
            },
            min: this.selectedPeriod === 'day' ? new Date(this.selectedDate).setHours(0, 0, 0, 0) : undefined,
            max: this.selectedPeriod === 'day' ? new Date(this.selectedDate).setHours(23, 59, 59, 999) : undefined,
          },
          y: { // <-- Axe Y unique pour les deux courbes
            title: { display: true, text: 'Puissance (W)' },
            beginAtZero: true
          }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    title: (context: TooltipItem<"line">[]) => {
                        if (context.length > 0) {
                            const date = new Date(this.mesures[context[0].dataIndex].timestamp);
                            return date.toLocaleString();
                        }
                        return '';
                    },
                    label: (context: TooltipItem<"line">) => {
                        const label = context.dataset.label || '';
                        if (context.raw !== null) {
                            return `${label}: ${context.raw} W`; // Ajout de l'unité W
                        }
                        return label;
                    }
                }
            }
        }
      }
    });
    console.log('DashboardComponent: Graphique rendu avec succès.');
  }
}