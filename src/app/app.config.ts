import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withFetch, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http'; // <-- Gardez celui-ci, mais nettoyez les imports non utilisés.
//import { TokenInterceptor } from './core/auth/http/token.interceptor'; // <-- Vérifiez si TokenInterceptor est encore utilisé.
import { AuthInterceptor } from './core/http/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    //provideHttpClient(withFetch(), withInterceptors([TokenInterceptor])) // <-- Peut être supprimé si AuthInterceptor le remplace
    provideHttpClient(withInterceptorsFromDi()), // <<<<< Utilisez ceci pour la compatibilité
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true // Ceci est important car il peut y avoir plusieurs intercepteurs
    }
  ]
};