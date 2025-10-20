import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { AuthService, User } from '../../services/auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PaginationComponent],
})
export class OrdersComponent {
  orders: any[] = [];
  paginatedOrders: any[] = [];

  statusFilter = '';
  storeIdFilter = '';
  searchTerm = '';

  currentPage = 1;
  itemsPerPage = 10;
  total = 0;

  isLoading = false;

  constructor(
    private orderService: OrderService,
    private authService: AuthService
  ) {}
  ngOnInit() {
    this.getOrders();
  }

  private getMerchantId(): string | null {
    const user: User | (User & { _id?: string }) | null =
      this.authService.getCurrentUser() as any;
    return (user as any)?._id || (user as any)?.id || null;
  }

  getOrders() {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;
    this.isLoading = true;
    this.orderService
      .getOrders(merchantId, {
        status: this.statusFilter || undefined,
        storeId: this.storeIdFilter || undefined,
        page: this.currentPage,
        limit: this.itemsPerPage,
      })
      .subscribe({
        next: (res) => {
          this.orders = res?.orders || res?.data || [];
          this.total = res?.total || this.orders.length;
          this.updatePagination();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching orders:', err);
          this.isLoading = false;
        },
      });
  }

  updateStatus(order: any, status: string) {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;
    this.orderService
      .updateOrderStatus(order._id || order.id, merchantId, status)
      .subscribe({
        next: () => {
          order.status = status;
        },
        error: (err: any) => console.error('Failed to update status', err),
      });
  }

  applyFilters() {
    this.currentPage = 1;
    this.getOrders();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.getOrders();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedOrders = this.orders.slice(start, end);
  }
}
