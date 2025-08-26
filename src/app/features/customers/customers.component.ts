import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../services/customer.service';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class CustomersComponent {
  customers: any[] = [];
  paginatedCustomers: any[] = [];

  storeIdFilter = '';
  currentPage = 1;
  itemsPerPage = 10;
  total = 0;

  isLoading = false;

  // create customer UI
  showCreate = false;
  isCreating = false;
  create: any = { name: '', email: '', phone: '' };

  constructor(
    private customerService: CustomerService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.getCustomers();
  }

  private getMerchantId(): string | null {
    const user: User | (User & { _id?: string }) | null =
      this.authService.getCurrentUser() as any;
    return (user as any)?._id || (user as any)?.id || null;
  }

  getCustomers() {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;
    this.isLoading = true;
    this.customerService
      .getCustomers(merchantId, {
        storeId: this.storeIdFilter || undefined,
        page: this.currentPage,
        limit: this.itemsPerPage,
      })
      .subscribe({
        next: (res) => {
          this.customers = res?.customers || res?.data || [];
          this.total = res?.total || this.customers.length;
          this.updatePagination();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching customers:', err);
          this.isLoading = false;
        },
      });
  }

  createCustomer() {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;
    if (!this.create?.name || !this.create?.email) return;
    this.isCreating = true;
    this.customerService.createCustomer(merchantId, this.create).subscribe({
      next: () => {
        this.isCreating = false;
        this.showCreate = false;
        this.create = { name: '', email: '', phone: '' };
        this.getCustomers();
      },
      error: (err) => {
        this.isCreating = false;
        console.error('Create customer failed', err);
      },
    });
  }

  applyFilters() {
    this.currentPage = 1;
    this.getCustomers();
  }

  onPageChange(page: number) {
    if (page < 1 || page > Math.ceil(this.total / this.itemsPerPage)) return;
    this.currentPage = page;
    this.getCustomers();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedCustomers = this.customers.slice(start, end);
  }
}
