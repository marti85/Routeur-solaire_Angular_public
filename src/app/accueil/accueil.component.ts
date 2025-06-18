// src/app/accueil/accueil.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // Ajoutez RouterLink car il est utilisé dans le template

// Supprimez les imports de LoginComponent et RegisterComponent
// import { LoginComponent } from '../auth/pages/login/login.component';
// import { RegisterComponent } from '../auth/pages/register/register.component';

@Component({
  selector: 'app-accueil',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink // N'oubliez pas RouterLink si vous utilisez routerLink dans le template
    // Supprimez LoginComponent et RegisterComponent de la liste des imports
  ],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.css'
})
export class AccueilComponent implements OnInit {
  constructor() {
    console.log('AccueilComponent: Constructor called.');
  }

  ngOnInit(): void {
    console.log('AccueilComponent: ngOnInit called.');
  }
}