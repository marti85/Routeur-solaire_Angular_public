// src/app/routers/router-list/router-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core'; // Importez OnDestroy
import { CommonModule } from '@angular/common'; // Pour ngFor, ngIf
import { FormsModule } from '@angular/forms'; // Pour [(ngModel)]
import { RouterModule } from '@angular/router'; // Pour routerLink

import { RouterService, Routeur } from '../../services/router.service';
import { AppareilService, Appareil, Configuration } from '../../services/appareil.service'; // Importez le nouveau service et interfaces
import { Subscription } from 'rxjs'; // Pour gérer les souscriptions

// Déclarer bootstrap pour accéder aux fonctions JS des modales
// Assurez-vous que bootstrap.bundle.min.js est inclus dans angular.json
declare var bootstrap: any;

@Component({
  selector: 'app-router-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // Ajoutez FormsModule et RouterModule
  templateUrl: './router-list.component.html',
  styleUrls: ['./router-list.component.css']
})
export class RouterListComponent implements OnInit, OnDestroy { // Implémentez OnDestroy
  routeurs: Routeur[] = [];
  errorMessage: string | null = null;
  private routerSubscription: Subscription | undefined;

  // Propriétés pour la modale d'ajout/modification d'appareil
  currentRouteurId: number | null = null;
  currentRouteurName: string = '';
  currentRouteurAppareils: Appareil[] = []; // Pour afficher la liste des appareils dans la modale

  newAppareil: Appareil = { nom: '', type: '', puissance_max: 0, routeur: 0 };
  newConfiguration: Configuration = { appareil: 0, seuil_activation: 0, plage_horaire_debut: '00:00', plage_horaire_fin: '23:59' };
  isEditAppareilMode: boolean = false;
  editingAppareilId: number | null = null;
  editingConfigurationId: number | null = null;

  constructor(
    private routerService: RouterService,
    private appareilService: AppareilService, // Injectez le service AppareilService
  ) {}

  ngOnInit(): void {
    this.loadRouteurs();
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe(); // Désouscription pour éviter les fuites de mémoire
    }
  }

  loadRouteurs(): void {
    this.routerSubscription = this.routerService.getRouteurs().subscribe({
      next: (data) => {
        this.routeurs = data;
        this.errorMessage = null;
        console.log('Routeurs loaded:', this.routeurs);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des routeurs: ' + (err.error?.message || err.message);
        console.error('Failed to load routers:', err);
      }
    });
  }

  deleteRouteur(id: number | undefined): void {
    if (id === undefined) {
      console.error('Impossible de supprimer le routeur: l\'ID est indéfini.');
      return;
    }
    if (confirm('Êtes-vous sûr de vouloir supprimer ce routeur ? Tous les appareils et mesures associés seront également supprimés.')) {
      this.routerService.deleteRouteur(id).subscribe({
        next: () => {
          this.loadRouteurs(); // Recharger la liste complète des routeurs après suppression
          this.errorMessage = null;
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la suppression du routeur: ' + (err.error?.detail || err.message);
          console.error('Failed to delete routeur:', err);
        }
      });
    }
  }

  performConnectionTest(id: number): void {
    this.routerService.performConnectionTest(id).subscribe({
      next: (response) => {
        alert(response.message); // Affiche le message de la simulation MQTT
        this.loadRouteurs(); // Recharger pour mettre à jour le statut du routeur
      },
      error: (err) => {
        alert('Erreur lors du test de connexion: ' + (err.error?.message || err.message));
        console.error('Failed to perform connection test:', err);
      }
    });
  }

  // --- Fonctions pour la gestion des Appareils et Configurations ---

  // Ouvre la modale pour un routeur donné (mode ajout initial d'appareil)
  openConfigureModal(routeur: Routeur): void {
    this.currentRouteurId = routeur.id!;
    this.currentRouteurName = routeur.nom;
    this.currentRouteurAppareils = routeur.appareils || []; // Charge les appareils du routeur

    this.resetAppareilForm(); // Réinitialise le formulaire pour un nouvel ajout

    // Afficher la modale manuellement avec Bootstrap 5
    const modalElement = document.getElementById('configureAppareilModal');
    if (modalElement) {
      const bsModal = new bootstrap.Modal(modalElement);
      bsModal.show();
    }
    // Charge les appareils après l'ouverture de la modale
    if (this.currentRouteurId) {
      this.refreshCurrentRouteurAppareils();
    }

  }

  // Ouvre la modale pour modifier un appareil spécifique
  openConfigureModalForEdit(appareilToEdit: Appareil): void {
    this.isEditAppareilMode = true;
    this.editingAppareilId = appareilToEdit.id!;
    
    // Crée une copie profonde pour éviter de modifier l'objet directement dans la liste
    this.newAppareil = { ...appareilToEdit };
    
    if (appareilToEdit.configuration) {
      this.editingConfigurationId = appareilToEdit.configuration.id!;
      this.newConfiguration = { ...appareilToEdit.configuration };
    } else {
      // Si l'appareil n'a pas encore de configuration, initialise une nouvelle pour l'édition
      this.editingConfigurationId = null;
      this.newConfiguration = { 
        appareil: appareilToEdit.id!, 
        seuil_activation: 0, 
        plage_horaire_debut: '00:00', 
        plage_horaire_fin: '23:59' 
      };
    }
    // La modale est déjà ouverte par openConfigureModal.
    // Cette fonction ne fait que pré-remplir le formulaire dans la modale déjà ouverte.
  }

  resetAppareilForm(): void {
    this.isEditAppareilMode = false;
    this.editingAppareilId = null;
    this.editingConfigurationId = null;
    this.newAppareil = { nom: '', type: '', puissance_max: 0, routeur: this.currentRouteurId! };
    this.newConfiguration = { appareil: 0, seuil_activation: 0, plage_horaire_debut: '00:00', plage_horaire_fin: '23:59' };
  }

  saveAppareil(): void {
    // Assurez-vous que l'ID du routeur est défini pour le nouvel appareil
    this.newAppareil.routeur = this.currentRouteurId!;

    if (this.isEditAppareilMode && this.editingAppareilId) {
      // Mode édition d'appareil existant
      this.appareilService.updateAppareil(this.editingAppareilId, this.newAppareil).subscribe({
        next: (updatedAppareil) => {
          console.log('Appareil mis à jour:', updatedAppareil);
          this.saveConfiguration(updatedAppareil.id!); // Sauvegarder/mettre à jour la configuration associée
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la mise à jour de l\'appareil: ' + (err.error?.message || err.message || JSON.stringify(err.error));
          console.error('Failed to update appareil:', err);
        }
      });
    } else {
      // Mode ajout de nouvel appareil
      this.appareilService.createAppareil(this.newAppareil).subscribe({
        next: (createdAppareil) => {
          console.log('Appareil créé:', createdAppareil);
          this.saveConfiguration(createdAppareil.id!); // Sauvegarder la configuration associée
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la création de l\'appareil: ' + (err.error?.message || err.message || JSON.stringify(err.error));
          console.error('Failed to create appareil:', err);
        }
      });
    }
  }

  saveConfiguration(appareilId: number): void {
    this.newConfiguration.appareil = appareilId; // Lie la configuration à l'appareil (nouvellement créé ou existant)

    if (this.isEditAppareilMode && this.editingConfigurationId) {
      // Si on est en mode édition et qu'une config existait pour cet appareil
      this.appareilService.updateConfiguration(this.editingConfigurationId, this.newConfiguration).subscribe({
        next: () => {
          console.log('Configuration mise à jour.');
          this.refreshCurrentRouteurAppareils(); // Rafraîchir les appareils dans la modale
          this.resetAppareilForm(); // Réinitialiser le formulaire après succès
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la mise à jour de la configuration: ' + (err.error?.message || err.message || JSON.stringify(err.error));
          console.error('Failed to update configuration:', err);
        }
      });
    } else {
      // Si on est en mode ajout, ou si l'appareil n'avait pas de config et qu'on en crée une
      this.appareilService.createConfiguration(this.newConfiguration).subscribe({
        next: () => {
          console.log('Configuration créée.');
          this.refreshCurrentRouteurAppareils(); // Rafraîchir les appareils dans la modale
          this.resetAppareilForm(); // Réinitialiser le formulaire après succès
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la création de la configuration: ' + (err.error?.message || err.message || JSON.stringify(err.error));
          console.error('Failed to create configuration:', err);
        }
      });
    }
  }

  deleteAppareil(appareilId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet appareil et sa configuration associée ?')) {
      this.appareilService.deleteAppareil(appareilId).subscribe({
        next: () => {
          console.log('Appareil supprimé.');
          this.refreshCurrentRouteurAppareils(); // Rafraîchir les appareils dans la modale
          this.resetAppareilForm(); // Réinitialiser le formulaire
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la suppression de l\'appareil: ' + (err.error?.detail || err.message || JSON.stringify(err.error));
          console.error('Failed to delete appareil:', err);
        }
      });
    }
  }

  // Recharge uniquement les appareils du routeur actuellement sélectionné pour la modale
  refreshCurrentRouteurAppareils(): void {
    if (this.currentRouteurId) {
      this.appareilService.getAppareilsByRouteur(this.currentRouteurId).subscribe({
        next: (appareils) => {
          this.currentRouteurAppareils = appareils;
          // Mettre à jour la liste principale des routeurs pour que les changements soient visibles partout
          this.loadRouteurs();
        },
        error: (err) => {
          console.error('Failed to refresh appareils for current router:', err);
          this.errorMessage = 'Erreur lors du rafraîchissement des appareils: ' + (err.error?.message || err.message);
        }
      });
    }
  }

  // Ferme la modale et recharge tous les routeurs
  closeModalAndReload(): void {
    const modalElement = document.getElementById('configureAppareilModal');
    if (modalElement) {
      const bsModal = bootstrap.Modal.getInstance(modalElement);
      if (bsModal) {
        bsModal.hide();
      }
    }
    this.loadRouteurs(); // Recharger tous les routeurs pour refléter les changements
  }

  // Si vous avez un composant RouterFormComponent pour la création/modification de routeurs
  // Vous pourriez le lier via un service ou un Output()
  // openRouterFormModal(routeur?: Routeur): void {
  //   // Logique pour ouvrir la modale de formulaire de routeur
  // }
}