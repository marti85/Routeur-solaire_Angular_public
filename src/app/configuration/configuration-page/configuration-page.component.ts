import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Nécessaire pour les standalone components
import { FormsModule } from '@angular/forms'; // Si vous avez des formulaires de config

@Component({
  selector: 'app-configuration-page',
  standalone: true, // Marqué comme standalone
  imports: [CommonModule, FormsModule], // Importez ce qui est nécessaire
  templateUrl: './configuration-page.component.html',
  styleUrls: ['./configuration-page.component.css']
})
export class ConfigurationPageComponent {
  // Ajoutez ici des propriétés pour votre configuration, par exemple :
  appName: string = 'Mon Routeur Solaire';
  apiBaseUrl: string = 'http://localhost:8000/api/';
  refreshInterval: number = 5; // en secondes

  saveConfiguration(): void {
    // Logique pour sauvegarder la configuration (par exemple, dans un service)
    console.log('Configuration sauvegardée :', {
      appName: this.appName,
      apiBaseUrl: this.apiBaseUrl,
      refreshInterval: this.refreshInterval
    });
    alert('Configuration sauvegardée !');
  }
}