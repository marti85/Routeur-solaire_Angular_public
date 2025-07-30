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

  onRegister() {
  // Assurez-vous que l'objet this.user contient toutes les données nécessaires
  console.log('Données utilisateur pour inscription :', this.user);

  this.authService.register(this.user).pipe(
    catchError(httpErrorResponse => {
      // httpErrorResponse est l'objet HttpErrorResponse complet
      console.error('Erreur lors de l\'inscription (HttpErrorResponse) :', httpErrorResponse);

      let errorMessage = 'Une erreur inattendue est survenue lors de l\'inscription.';

      // Vérifiez si la réponse d'erreur contient un objet 'error' du backend
      if (httpErrorResponse.error && typeof httpErrorResponse.error === 'object') {
        const backendErrors = httpErrorResponse.error;
        let detailedMessages: string[] = [];

        // Itérer sur les clés de l'objet d'erreurs du backend (ex: 'username', 'email', 'password')
        for (const key in backendErrors) {
          if (backendErrors.hasOwnProperty(key)) {
            // Chaque clé peut contenir un tableau de messages d'erreur (ex: ["A user with that username already exists."])
            if (Array.isArray(backendErrors[key])) {
              backendErrors[key].forEach((msg: string) => {
                detailedMessages.push(`${key}: ${msg}`);
              });
            } else {
              // Au cas où ce ne serait pas un tableau (moins courant pour DRF, mais possible)
              detailedMessages.push(`${key}: ${backendErrors[key]}`);
            }
          }
        }

        if (detailedMessages.length > 0) {
          errorMessage = 'Erreur d\'inscription : \n' + detailedMessages.join('\n');
        } else {
          // Si error.error est un objet mais vide ou non conforme à ce qui est attendu
          errorMessage = 'Une erreur de validation est survenue, mais les détails sont inconnus.';
        }
      } else if (httpErrorResponse.message) {
        // Gère les erreurs réseau ou autres erreurs HttpErrorResponse avec un message simple
        errorMessage = `Erreur réseau ou client: ${httpErrorResponse.message}`;
      }

      alert(errorMessage);
      return of(null); // Retourne un observable qui émet null pour que le flux se termine proprement
    })
  ).subscribe(response => {
    if (response) { // S'assurer que la réponse n'est pas null à cause de catchError
      console.log('Inscription réussie :', response);
      alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
      this.router.navigate(['/auth/login']); // Redirige vers la page de connexion
    }
  });
}
}