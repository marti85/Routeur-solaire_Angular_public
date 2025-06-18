// src/app/auth/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; // Assurez-vous du bon chemin

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // <<< CORRECTION ICI : Utilisez authService.isAuthenticated au lieu de authService.isLoggedIn()
    if (this.authService.isAuthenticated) {
      console.log('AuthGuard: Utilisateur connecté. Accès autorisé.');
      return true;
    } else {
      console.log('AuthGuard: Utilisateur non connecté. Redirection vers la page de connexion.');
      return this.router.createUrlTree(['/auth/login']); // Redirige vers la page de connexion
    }
  }
}