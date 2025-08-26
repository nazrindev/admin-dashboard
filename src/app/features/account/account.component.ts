import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="account">
      <h2>My Account</h2>
      <div *ngIf="user; else noUser">
        <p><strong>Name:</strong> {{ user.name }}</p>
        <p><strong>Email:</strong> {{ user.email }}</p>
        <p><strong>ID:</strong> {{ userId }}</p>
        <button (click)="logout()">Logout</button>
      </div>
      <ng-template #noUser>
        <p>Not signed in.</p>
      </ng-template>
    </div>
  `,
  styles: [
    `
      .account {
        padding: 1rem;
      }
    `,
    `
      h2 {
        margin-bottom: 1rem;
      }
    `,
    `
      button {
        padding: 0.5rem 1rem;
      }
    `,
  ],
})
export class AccountComponent {
  user: User | (User & { _id?: string }) | null = null;
  userId: string | null = null;
  constructor(private auth: AuthService) {
    this.user = this.auth.getCurrentUser() as any;
    this.userId = (this.user as any)?._id || (this.user as any)?.id || null;
  }
  logout() {
    this.auth.logout();
    window.location.href = '/login';
  }
}
