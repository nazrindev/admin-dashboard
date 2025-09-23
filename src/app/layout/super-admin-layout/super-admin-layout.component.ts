import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-super-admin-layout',
  imports: [RouterModule, CommonModule],
  templateUrl: './super-admin-layout.component.html',
  styleUrl: './super-admin-layout.component.scss',
})
export class SuperAdminLayoutComponent {
  currentUser$;
  adminName: string | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
    const user: User | (User & { adminName?: string; _id?: string }) | null =
      this.authService.getCurrentUser() as any;
    this.adminName =
      (user as any)?.adminName ||
      localStorage.getItem('adminName') ||
      user?.name ||
      'Super Admin';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/super-admin/login']);
  }
}
