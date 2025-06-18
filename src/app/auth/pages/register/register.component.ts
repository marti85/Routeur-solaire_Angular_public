// src/app/auth/pages/register/register.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // Import du service d'authentification
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators'; // Importer catchError pour la gestion des erreurs
import { of } from 'rxjs'; // Importer of pour créer un observable à partir d'une valeur

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  user: any = {
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    password2: ''
  };

  constructor(private authService: AuthService, private router: Router) { }

  onRegister(): void {
    console.log('Tentative d\'inscription avec les données:', this.user);

    if (this.user.password !== this.user.password2) {
      alert('Les mots de passe ne correspondent pas.');
      return;
    }

    // Vérification minimale que les champs essentiels sont remplis avant d'appeler l'API
    if (this.user.username && this.user.email && this.user.password) {
      // Appel réel au service d'authentification
      this.authService.register(this.user).pipe(
        catchError(error => {
          // Gestion des erreurs de l'API
          console.error('Erreur lors de l\'inscription :', error);
          if (error.error && typeof error.error === 'object') {
            // Afficher les erreurs spécifiques du backend (ex: email déjà pris, mot de passe trop faible)
            let errorMessage = 'Erreur d\'inscription : ';
            for (const key in error.error) {
              if (error.error.hasOwnProperty(key)) {
                errorMessage += `\n${key}: ${error.error[key]}`;
              }
            }
            alert(errorMessage);
          } else {
            alert('Une erreur inattendue est survenue lors de l\'inscription.');
          }
          return of(null); // Retourne un observable qui émet null pour que le flux se termine proprement
        })
      ).subscribe(response => {
        if (response) { // S'assurer que la réponse n'est pas null à cause de catchError
          console.log('Inscription réussie :', response);
          alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
          this.router.navigate(['/auth/login']); // Redirige vers la page de connexion
        }
      });
    } else {
      console.warn('Veuillez remplir tous les champs obligatoires du formulaire d\'inscription.');
      alert('Veuillez remplir tous les champs obligatoires.');
    }
  }
}