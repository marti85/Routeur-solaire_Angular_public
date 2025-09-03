import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core'; // Importez OnInit
import { FormsModule } from '@angular/forms'; // Gardez FormsModule car vous utilisez un formulaire template-driven
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { of } from 'rxjs'; // Importez 'of'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink], 
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit { 

  // Propriété pour lier les entrées du formulaire (utilisation de ngModel)
  credentials = {
    username: '',
    password: ''
  };

  // Propriété pour afficher les messages d'erreur à l'utilisateur
  errorMessage: string | null = null; 

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    console.log('LoginComponent: Constructor called.'); // Log au démarrage du composant
  }

  ngOnInit(): void {
    console.log('LoginComponent: ngOnInit called.'); // Log quand le composant est initialisé
  }

  // Cette méthode est appelée lorsque le formulaire est soumis
  onLogin(): void {
    console.log('LoginComponent: onLogin() called - Attempting to log in.'); // Log au début de la méthode

    // Réinitialise le message d'erreur à chaque nouvelle tentative
    this.errorMessage = null; 

    // Vérification des champs 
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Veuillez renseigner le nom d\'utilisateur et le mot de passe.';
      console.warn('LoginComponent: Form credentials missing.');
      return; // Arrête l'exécution si les champs sont vides
    }

    console.log('LoginComponent: Submitting credentials to AuthService:', this.credentials); // Log des credentials envoyés

    this.authService.login(this.credentials).pipe(
      // Si handleError renvoie un Observable<never> ou throwError, ce catchError pourrait être simplifié
      catchError((error: HttpErrorResponse) => {
        console.error('LoginComponent: Login error caught in component:', error);
        let clientErrorMessage = 'Échec de la connexion. Veuillez vérifier vos identifiants.';
        
        // Tentative d'extraire un message d'erreur plus spécifique du backend
        if (error.error && typeof error.error === 'object') {
          // Exemple pour Django REST Framework:
          if (error.error.detail) { // Pour les erreurs de type 401 Unauthorized
            clientErrorMessage = `Erreur: ${error.error.detail}`;
          } else if (error.error.non_field_errors) { // Pour des erreurs générales de formulaire
            clientErrorMessage = `Erreur: ${error.error.non_field_errors.join(', ')}`;
          } else {
            // Afficher tous les messages d'erreur du backend
            clientErrorMessage = 'Erreur de connexion:';
            for (const key in error.error) {
              if (error.error.hasOwnProperty(key)) {
                clientErrorMessage += `\n${key}: ${Array.isArray(error.error[key]) ? error.error[key].join(', ') : error.error[key]}`;
              }
            }
          }
        } else if (error.message) {
          clientErrorMessage = `Erreur réseau: ${error.message}`;
        }
        
        this.errorMessage = clientErrorMessage; // Met à jour le message d'erreur pour l'affichage
        // Important: retourner un observable vide pour que la chaîne d'observables se termine proprement
        return of(null); 
      })
    ).subscribe(response => {
      // Le 'response' ici sera 'null' si une erreur a été capturée par catchError
      if (response) { 
        console.log('LoginComponent: Login successful, navigating to dashboard.');
        // Normalement, la redirection est déjà gérée dans AuthService.login()
        this.router.navigate(['/dashboard']); 
      } else {
        console.log('LoginComponent: Login failed (response was null after error handling).');
        // Ne rien faire ici car errorMessage a déjà été mis à jour par catchError
      }
    });
  }
}