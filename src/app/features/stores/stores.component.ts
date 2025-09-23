import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService, Store } from '../../services/store.service';
import { AuthService } from '../../services/auth.service';
// Removed approval functionality - this is now in super admin panel

@Component({
  selector: 'app-stores',
  imports: [CommonModule, FormsModule],
  templateUrl: './stores.component.html',
  styleUrl: './stores.component.scss',
})
export class StoresComponent implements OnInit {
  stores: Store[] = [];
  loading = false;
  successMessage = '';
  errorMessage = '';
  // Removed approval modal - now handled in super admin panel

  constructor(
    private storeService: StoreService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadStores();
  }

  loadStores() {
    this.loading = true;
    const merchantId = this.getMerchantId();

    this.storeService.getStores(merchantId).subscribe({
      next: (response) => {
        console.log('Stores API Response:', response);
        // Handle both array response and object with stores property
        if (Array.isArray(response)) {
          this.stores = response;
        } else if (
          response &&
          response.stores &&
          Array.isArray(response.stores)
        ) {
          this.stores = response.stores;
        } else if (response && Array.isArray(response.data)) {
          this.stores = response.data;
        } else {
          console.warn('Unexpected API response structure:', response);
          this.stores = [];
        }
        console.log('Final stores array:', this.stores);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stores:', error);
        this.setError('Failed to load stores');
        this.loading = false;
        this.stores = []; // Ensure stores is always an array
      },
    });
  }

  // Removed featured toggle functionality - now handled in super admin panel
  // Merchants can only view their store status

  // Removed updateFeaturedStatus - now handled in super admin panel

  getMerchantId(): string {
    const user = this.authService.getCurrentUser();
    return (user as any)?.id || (user as any)?._id || '';
  }

  setSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  setError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-IN');
  }

  isFeaturedExpired(store: Store): boolean {
    if (!store.featured || !store.featuredExpiry) return false;
    return new Date(store.featuredExpiry) < new Date();
  }
}
