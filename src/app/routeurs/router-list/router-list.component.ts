// src/app/routeurs/router-list/router-list.component.ts

import { Component, OnInit } from '@angular/core';
import { RouterService, Routeur } from '../../services/router.service'; // Importez Routeur
import { CommonModule } from '@angular/common'; // Pour ngFor, ngIf
import { RouterModule } from '@angular/router'; // Pour routerLink

@Component({
  selector: 'app-router-list',
  standalone: true,
  imports: [CommonModule, RouterModule], // Ajoutez RouterModule
  templateUrl: './router-list.component.html',
  styleUrls: ['./router-list.component.css']
})
export class RouterListComponent implements OnInit {
  routeurs: Routeur[] = []; // Utilisez l'interface Routeur
  errorMessage: string | null = null;

  constructor(private routerService: RouterService) { }

  ngOnInit(): void {
    this.loadRouteurs();
  }

  loadRouteurs(): void {
    this.routerService.getRouteurs().subscribe({ // Appelle getRouteurs
      next: (data) => {
        this.routeurs = data;
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des routeurs: ' + err.message;
        console.error('Failed to load routeurs:', err);
      }
    });
  }

  deleteRouteur(id: number | undefined): void {
    if (id === undefined) {
      console.error('Impossible de supprimer le routeur: l\'ID est indéfini.');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer ce routeur ?')) {
      this.routerService.deleteRouteur(id).subscribe({ // Appelle deleteRouteur
        next: () => {
          this.routeurs = this.routeurs.filter(r => r.id !== id);
          this.errorMessage = null;
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la suppression du routeur: ' + err.message;
          console.error('Failed to delete routeur:', err);
        }
      });
    }
  }
}