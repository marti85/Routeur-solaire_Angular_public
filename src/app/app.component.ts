import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

//import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
//import { HeaderComponent } from './shared/components/header/header.component';


@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet
    //SidebarComponent,
    //HeaderComponent   
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit { // Implémentez OnInit si vous utilisez ngOnInit

  title = 'frontend-routeur'; // Exemple de propriété

  constructor() {
    console.log('AppComponent: Constructor called.'); // Log dans le constructeur
    // Vous pouvez aussi y initialiser des services ou des propriétés
  }

  ngOnInit(): void {
    console.log('AppComponent: ngOnInit called.'); // Log dans ngOnInit
    // C'est ici que vous mettriez la logique d'initialisation après que les entrées soient disponibles
  }
}