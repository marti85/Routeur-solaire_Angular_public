// src/app/account/account-settings/account-settings.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { AuthService } from '../../auth/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account-settings',
  imports: [ReactiveFormsModule, CommonModule ],
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.css'
})
export class AccountSettingsComponent {
  passwordForm: FormGroup;
  message: string = '';
  isSuccess: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(8)]],
      new_password_confirm: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.passwordForm.valid) {
      if (this.passwordForm.value.new_password !== this.passwordForm.value.new_password_confirm) {
        this.message = 'Les nouveaux mots de passe ne correspondent pas.';
        this.isSuccess = false;
        return;
      }
      
      this.authService.changePassword(this.passwordForm.value).subscribe(
        response => {
          this.message = 'Mot de passe modifié avec succès.';
          this.isSuccess = true;
          this.passwordForm.reset();
        },
        error => {
          this.message = error.message; // Récupère le message d'erreur du backend
          this.isSuccess = false;
          console.error(error);
        }
      );
    }
  }
}
