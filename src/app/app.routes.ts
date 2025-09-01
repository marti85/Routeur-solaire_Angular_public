// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component'; // Importé pour type hinting, bien que loadComponent soit utilisé
import { LoginComponent } from './auth/pages/login/login.component'; // Importé pour type hinting
import { AccueilComponent } from './accueil/accueil.component'; // Pour la page d'accueil
import { MainLayoutComponent } from './shared/main-layout/main-layout.component';
import { AuthGuard } from './auth/guards/auth.guard'; // Importez de AuthGuard 
import { RouterListComponent } from './routeurs/router-list/router-list.component';
import { RouterFormComponent } from './routeurs/router-form/router-form.component';


export const routes: Routes = [
  // 1. Route par défaut : Redirige vers la page d'accueil ou de connexion
  { path: '', redirectTo: 'accueil', pathMatch: 'full' }, // Redirige la racine vers /accueil par défaut

  // 2. Routes publiques (sans layout, sans authentification)
  { path: 'accueil', component: AccueilComponent }, // Votre page d'accueil

  // 3. Routes d'authentification (sans layout principal, utilisent leur propre layout ou pas de layout)
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // 4. Routes protégées avec le MainLayout (nécessitent authentification)
  // Cette route parente utilise MainLayoutComponent.
  // Toutes ses routes enfants seront rendues DANS le <router-outlet> du MainLayout.
  {
    path: '', // Chemin vide pour que les enfants soient directement sous le domaine (ex: /dashboard)
    component: MainLayoutComponent, // Le composant de layout principal
    canActivate: [AuthGuard], // Protége toutes les routes enfants de ce groupe avec AuthGuard
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },// La route pour le tableau de bord
      { path: 'routeurs', component: RouterListComponent }, // Route pour la liste des routeurs
      { path: 'routeurs/creer', component: RouterFormComponent }, // Route pour ajouter un routeur
      { path: 'routeurs/modifier/:id', component: RouterFormComponent }, // Route pour modifier un routeur

      { path: 'configuration_generale', loadComponent: () => import('./configuration/configuration-page/configuration-page.component').then(m => m.ConfigurationPageComponent) },
      { path: 'account-settings', loadComponent: () => import('./configuration/account-settings/account-settings.component').then(m => m.AccountSettingsComponent) },
      // Ajoutez ici d'autres routes qui doivent apparaître AVEC le MainLayout (header, sidebar)
      // Par exemple:
      // {
      //   path: 'mesures',
      //   loadComponent: () => import('./mesures/mesures.component').then(m => m.MesuresComponent) //
      // },
      // {
      //   path: 'routeurs',
      //   loadComponent: () => import('./routeur/routeur.component').then(m => m.RouteurComponent) //
      // },
    ]
  },



  // 5. Route de fallback (page 404 ou redirection)
  //{ path: '**', redirectTo: 'accueil' } // Toute URL non trouvée renverra à la page d'accueil
];
