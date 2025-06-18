import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
//import { AuthRoutingModule } from './auth-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Les composants de connexion et d'inscription seront déclarés ici
// import { LoginComponent } from './pages/login/login.component'; // À créer
// import { RegisterComponent } from './pages/register/register.component'; // À créer


@NgModule({
  declarations: [
      // LoginComponent,    // <-- Déclarez-les ici une fois créés
    // RegisterComponent  // <-- Déclarez-les ici une fois créés
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AuthModule { }
