// src/app/routeurs/router-form/router-form.component.ts

import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router as AngularRouter } from '@angular/router'; // Alias Router for clarity
import { RouterService, Routeur, RouteurType } from '../../services/router.service'; // Importez Routeur et RouteurType
import { CommonModule } from '@angular/common'; // Pour ngFor, ngIf

@Component({
  selector: 'app-router-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './router-form.component.html',
  styleUrls: ['./router-form.component.css']
})
export class RouterFormComponent implements OnInit {
  routeurForm: FormGroup;
  routeurId: number | null = null;
  isEditMode: boolean = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  routeurTypes: RouteurType[] = []; // Pour la liste des types de routeurs

  constructor(
    private fb: FormBuilder,
    private routerService: RouterService,
    private route: ActivatedRoute,
    public angularRouter: AngularRouter // Use alias here
  ) {
    this.routeurForm = this.fb.group({
      nom: ['', Validators.required],
      type: ['', Validators.required], // Type sera un ID de RouteurType
      identifiant: ['', Validators.required],
      code_securite: ['', Validators.required], // Requis uniquement pour la création
      // is_active n'est pas dans votre modèle Routeur, donc je l'ai retiré.
      // Si vous l'ajoutez à votre modèle Routeur Django, réintégrez-le ici.
    });
  }

  ngOnInit(): void {
    this.loadRouteurTypes(); // Charge les types de routeurs au démarrage
    this.routeurId = this.route.snapshot.params['id'];
    if (this.routeurId) {
      this.isEditMode = true;
      this.routeurForm.get('code_securite')?.clearValidators(); // Code sécurité n'est pas requis en modification
      this.routeurForm.get('code_securite')?.updateValueAndValidity();
      this.loadRouteur(this.routeurId);
    }
  }

  loadRouteur(id: number): void {
    this.routerService.getRouteur(id).subscribe({
      next: (routeur) => {
        // Attention: Votre modèle Routeur n'a pas de champ is_active.
        // Assurez-vous que les champs ici correspondent à votre modèle Django.
        this.routeurForm.patchValue({
          nom: routeur.nom,
          type: routeur.type, // L'ID du type
          identifiant: routeur.identifiant,
          // code_securite n'est pas retourné par le serializer en lecture,
          // donc ne pas essayer de le patcher ici.
        });
        this.successMessage = null;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement du routeur: ' + err.message;
        console.error('Failed to load routeur:', err);
      }
    });
  }

  loadRouteurTypes(): void {
    this.routerService.getRouteurTypes().subscribe({
      next: (data) => {
        this.routeurTypes = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des types de routeurs:', err);
        this.errorMessage = 'Impossible de charger les types de routeurs.';
      }
    });
  }

  onSubmit(): void {
    this.successMessage = null;
    this.errorMessage = null;

    if (this.routeurForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires.';
      // Optionally, mark all fields as touched to display validation errors
      this.markAllAsTouched(this.routeurForm);
      return;
    }

    const routeurData: Routeur = this.routeurForm.value;

    if (this.isEditMode && this.routeurId) {
      // Pour la mise à jour, le code_securite n'est pas nécessaire et ne doit pas être envoyé
      // si le champ est vide ou si vous ne voulez pas le modifier.
      // Filter out 'code_securite' if it's not meant to be updated or is empty.
      const dataToSend = { ...routeurData };
      if (!this.routeurForm.get('code_securite')?.value) {
        delete dataToSend.code_securite;
      }

      this.routerService.updateRouteur(this.routeurId, dataToSend).subscribe({
        next: () => {
          this.successMessage = 'Routeur mis à jour avec succès !';
          this.angularRouter.navigate(['/routeurs']);
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la mise à jour du routeur: ' + err.message;
          console.error('Failed to update routeur:', err);
        }
      });
    } else {
      this.routerService.addRouteur(routeurData).subscribe({
        next: () => {
          this.successMessage = 'Routeur ajouté avec succès !';
          this.routeurForm.reset(); // Réinitialiser le formulaire après l'ajout
          this.routeurForm.get('type')?.setValue(''); // Réinitialise spécifiquement le sélecteur
          this.angularRouter.navigate(['/routeurs']);
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de l\'ajout du routeur: ' + err.message;
          console.error('Failed to add routeur:', err);
        }
      });
    }
  }

  private markAllAsTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markAllAsTouched(control as FormGroup);
      }
    });
  }
}