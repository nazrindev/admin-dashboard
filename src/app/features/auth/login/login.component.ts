import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { StoreService } from '../../../services/store.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private storeService: StoreService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: (res) => {
          console.log('Login successful:', res);

          if (res.token && res.user) {
            this.authService.setAuthData(res.token, res.user);
            localStorage.setItem('userId', res.user.id);
            // If defaultStoreId exists, fetch and store as currentStore
            const defaultStoreId = (res.user as any)?.defaultStoreId;
            if (defaultStoreId) {
              this.storeService.getStore(defaultStoreId).subscribe({
                next: (store) => {
                  localStorage.setItem('currentStore', JSON.stringify(store));
                  this.router.navigate(['/dashboard']);
                },
                error: () => {
                  // Proceed without blocking login if store fetch fails
                  this.router.navigate(['/dashboard']);
                },
              });
            } else {
              this.router.navigate(['/dashboard']);
            }
          } else {
            this.errorMessage = 'No token received from server';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Login failed:', err);
          this.errorMessage =
            err.error?.message || 'Login failed. Please try again.';
          this.isLoading = false;
        },
      });
    }
  }
}
