import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterModule, CommonModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  currentUser$;
  storeName: string | null = null;

  constructor(private authService: AuthService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
    const user: User | (User & { storeName?: string; _id?: string }) | null =
      this.authService.getCurrentUser() as any;
    this.storeName =
      (user as any)?.storeName ||
      localStorage.getItem('storeName') ||
      user?.name ||
      null;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
