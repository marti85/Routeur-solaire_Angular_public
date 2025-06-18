// src/app/auth/auth.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component'; // Importez le LoginComponent standalone
import { RegisterComponent } from './pages/register/register.component'; // Importez le RegisterComponent standalone

export const AUTH_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // Vous pouvez ajouter une redirection par défaut si vous le souhaitez
  // { path: '', redirectTo: 'login', pathMatch: 'full' }
];