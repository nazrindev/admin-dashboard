import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

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
		private router: Router
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
						this.router.navigate(['/dashboard']);
					} else {
						this.errorMessage = 'No token received from server';
					}
					this.isLoading = false;
				},
				error: (err) => {
					console.error('Login failed:', err);
					this.errorMessage = err.error?.message || 'Login failed. Please try again.';
					this.isLoading = false;
				},
			});
		}
	}
}
