// src/app/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterService, Routeur } from '../services/router.service';
import { MesureService, Mesure, MesureAgregeeDaily, MesureAgregeeHourly, MesureAgregeeMonthlyYearly } from '../services/mesure.service';
import { Chart, registerables, TooltipItem } from 'chart.js';
import { Subscription } from 'rxjs';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  routeurs: Routeur[] = [];
  selectedRouteurId: number | null = null;
  mesures: any[] = [];
  errorMessage: string | null = null;
  selectedDate: string = '';
  selectedPeriod: 'day' | 'month' | 'year' = 'day';

  private chartInstance: Chart | null = null;
  private routerSubscription: Subscription | undefined;
  private mesureSubscription: Subscription | undefined;

  constructor(
    private routerService: RouterService,
    private mesureService: MesureService
  ) {}

  ngOnInit(): void {
    this.selectedDate = this.getTodayDateString();
    this.loadRouteurs();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
    if (this.mesureSubscription) this.mesureSubscription.unsubscribe();
    if (this.chartInstance) this.chartInstance.destroy();
  }

  private getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  loadRouteurs(): void {
    this.routerSubscription = this.routerService.getRouteurs().subscribe({
      next: (data) => {
        this.routeurs = data;
        if (this.routeurs.length > 0 && !this.selectedRouteurId) {
          this.selectedRouteurId = this.routeurs[0].id!;
          this.onSelectionChange();
        }
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des routeurs: ' + err.message;
        console.error('Failed to load routers:', err);
      }
    });
  }

  onSelectionChange(): void {
    if (this.selectedRouteurId && this.selectedDate) {
      let startDate: string | undefined;
      let endDate: string | undefined;
      const baseDate = new Date(this.selectedDate);

      if (this.selectedPeriod === 'day') {
        startDate = this.selectedDate;
        const nextDay = new Date(baseDate);
        nextDay.setDate(baseDate.getDate() + 1);
        endDate = nextDay.toISOString().split('T')[0];
      } else if (this.selectedPeriod === 'month') {
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1).toISOString().split('T')[0];
        const nextMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
        endDate = nextMonth.toISOString().split('T')[0];
      } else if (this.selectedPeriod === 'year') {
        startDate = new Date(baseDate.getFullYear(), 0, 1).toISOString().split('T')[0];
        const nextYear = new Date(baseDate.getFullYear() + 1, 0, 1);
        endDate = nextYear.toISOString().split('T')[0];
      }

      this.loadMesuresForSelectedRouteur(this.selectedRouteurId, startDate, endDate);
    } else {
      this.mesures = [];
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
    }
  }

  loadMesuresForSelectedRouteur(routeurId: number, startDate?: string, endDate?: string): void {
    if (this.mesureSubscription) this.mesureSubscription.unsubscribe();

    if (this.selectedPeriod === 'day') {
      this.mesureSubscription = this.mesureService.getMesuresByRouteur(routeurId, startDate, endDate).subscribe({
        next: (data) => this.traiterMesuresRecues(data),
        error: (err) => this.traiterErreurMesures(err)
      });
    } else {
      const period = this.selectedPeriod === 'month' ? 'day' : 'month';
      this.mesureSubscription = this.mesureService.getMesuresAgregeesByRouteur(routeurId, startDate, endDate, period).subscribe({
        next: (data) => {
          const mesuresAdaptées: Mesure[] = data.map(item => ({
            timestamp: (item as any).timestamp || (item as any).date || (item as any).timestamp_interval_start,
            puissance_solaire: (item as any).puissance_solaire_moyenne ?? null,
            puissance_soutiree: (item as any).puissance_soutiree_moyenne ?? null,
            ouverture_triac: (item as any).ouverture_triac_moyenne ?? null,
            routeur: (item as any).routeur || (item as any).routeur_id || 0,
          }));
          this.traiterMesuresRecues(mesuresAdaptées);
        },
        error: (err) => this.traiterErreurMesures(err)
      });
    }
  }

  private traiterMesuresRecues(data: Mesure[]): void {
    this.mesures = data;
    this.errorMessage = null;
    if (this.mesures.length > 0) {
      setTimeout(() => this.renderChart(), 0);
    } else {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
    }
  }

  private traiterErreurMesures(err: any): void {
    this.errorMessage = 'Erreur lors du chargement des mesures: ' + err.message;
    this.mesures = [];
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  renderChart(): void {
    if (this.chartInstance) this.chartInstance.destroy();
    const canvas = document.getElementById('mesuresChart') as HTMLCanvasElement;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const timestamps = this.mesures.map(m => new Date(m.timestamp));
    const puissancesSolaires = this.mesures.map(m => m.puissance_solaire);
    const puissancesSoutirees = this.mesures.map(m => m.puissance_soutiree);

    let unit: 'hour' | 'day' | 'month' | 'year';
    let displayFormat: { [key: string]: string };
    let tooltipFormat: string;
    let xAxisTitle: string;

    if (this.selectedPeriod === 'day') {
      unit = 'hour';
      displayFormat = { hour: 'HH:mm', minute: 'HH:mm' };
      tooltipFormat = 'yyyy-MM-dd HH:mm:ss';
      xAxisTitle = 'Heure de la journée';
    } else if (this.selectedPeriod === 'month') {
      unit = 'day';
      displayFormat = { day: 'MMM dd' };
      tooltipFormat = 'MMM dd, yyyy';
      xAxisTitle = 'Jour du mois';
    } else {
      unit = 'month';
      displayFormat = { month: 'MMM yyyy' };
      tooltipFormat = 'MMM yyyy';
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
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Puissance soutirée (W)',
            data: puissancesSoutirees,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false,
            tension: 0.3,
            yAxisID: 'y'
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
              tooltipFormat: tooltipFormat
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
          y: {
            title: { display: true, text: 'Puissance (W)' },
            beginAtZero: true
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: (context: TooltipItem<'line'>[]) => {
                if (context.length > 0) {
                  const date = new Date(this.mesures[context[0].dataIndex].timestamp);
                  return date.toLocaleString();
                }
                return '';
              },
              label: (context: TooltipItem<'line'>) => {
                const label = context.dataset.label || '';
                return `${label}: ${context.raw} W`;
              }
            }
          }
        }
      }
    });
  }
}
