// src/app/shared/components/sidebar/sidebar.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common'; // isPlatformBrowser n'est pas nécessaire si seulement utilisé dans AuthService
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs'; // Importez Subscription
import { AuthService } from '../../../auth/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {
  username: string | null = 'Utilisateur Démo';
  isAdmin: boolean = false;
  private authSubscription: Subscription | null = null;
  //private isAdminSubscription: Subscription | null = null;

  constructor(private authService: AuthService) {
    console.log('SidebarComponent: Constructor called.');
  }

  ngOnInit(): void {
    console.log('SidebarComponent: ngOnInit called.');
    // S'abonner aux changements du nom d'utilisateur
    this.authSubscription = this.authService.currentUser$.subscribe(username => {
      this.username = username;
      console.log('SidebarComponent: Username updated:', this.username);
      // À ce stade, vous devriez également vérifier le rôle de l'utilisateur
      // Pour cela, votre AuthService devrait avoir une méthode pour récupérer les rôles/claims du token
      //this.isAdmin = this.authService.hasRole('admin'); // Exemple : vous devrez implémenter hasRole dans AuthService
      console.log('SidebarComponent: Is Admin:', this.isAdmin);
    });

    // Initialisation immédiate au cas où l'utilisateur est déjà connecté au chargement
    // Cette ligne pourrait être redondante si la souscription se déclenche immédiatement avec la valeur par défaut
    // this.username = this.authService.currentUserSubject.value;
    // console.log('SidebarComponent: Initial username from AuthService on ngOnInit:', this.username);
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
      console.log('SidebarComponent: Auth subscription unsubscribed.');
    }
    //if (this.isAdminSubscription) { 
    //  this.isAdminSubscription.unsubscribe();
    //}
    console.log('SidebarComponent: Auth subscriptions unsubscribed.');
  }

  logout(): void {
    this.authService.logout();
  }
}