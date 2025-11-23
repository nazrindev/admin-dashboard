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
  filteredOrders: any[] = [];
  paginatedOrders: any[] = [];

  statusFilter = '';
  storeIdFilter = '';
  searchTerm = '';

  currentPage = 1;
  itemsPerPage = 10;
  total = 0;

  isLoading = false;
  activeTab: 'upcoming' | 'completed' = 'upcoming';
  processingOrderId: string | null = null; // Track which order is being processed
  successMessage = '';
  errorMessage = '';

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
    // Load all orders without status filter to support tab filtering
    this.orderService
      .getOrders(merchantId, {
        status: undefined, // Don't filter by status, we'll filter by tab
        storeId: this.storeIdFilter || undefined,
        page: 1,
        limit: 1000, // Get all orders for client-side filtering
      })
      .subscribe({
        next: (res) => {
          this.orders = res?.orders || res?.data || [];
          this.applyTabFilter();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error fetching orders:', err);
          this.isLoading = false;
        },
      });
  }

  setActiveTab(tab: 'upcoming' | 'completed') {
    this.activeTab = tab;
    this.currentPage = 1;
    this.applyTabFilter();
  }

  getUpcomingOrders(): any[] {
    return this.orders
      .filter(
        (order) =>
          order.status !== 'delivered' && order.status !== 'cancelled'
      )
      .sort((a, b) => {
        // Sort by createdAt descending (latest first)
        const dateA = new Date(a.createdAt || a.placedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.placedAt || 0).getTime();
        return dateB - dateA;
      });
  }

  getCompletedOrders(): any[] {
    return this.orders.filter(
      (order) => order.status === 'delivered' || order.status === 'cancelled'
    );
  }

  applyTabFilter() {
    if (this.activeTab === 'upcoming') {
      this.filteredOrders = this.getUpcomingOrders();
    } else {
      this.filteredOrders = this.getCompletedOrders();
    }
    this.total = this.filteredOrders.length;
    this.updatePagination();
  }

  markReadyToPickup(order: any) {
    const merchantId = this.getMerchantId();
    if (!merchantId) {
      this.setError('Merchant ID not found. Please login again.');
      return;
    }

    const orderId = order._id || order.id;
    if (!orderId) {
      this.setError('Order ID not found.');
      return;
    }

    // Set loading state for this specific order
    this.processingOrderId = orderId;
    this.errorMessage = '';
    this.successMessage = '';

    this.orderService.markReadyToPickup(orderId, merchantId).subscribe({
      next: (response) => {
        // Update order status from response
        if (response.order) {
          const updatedOrder = response.order;
          const orderIndex = this.orders.findIndex(
            (o) => (o._id || o.id) === orderId
          );
          if (orderIndex !== -1) {
            this.orders[orderIndex] = { ...this.orders[orderIndex], ...updatedOrder };
          }
          // Also update the order object passed in
          order.status = updatedOrder.status || 'ready_to_pickup';
        } else {
          order.status = 'ready_to_pickup';
        }

        this.setSuccess(
          response.message || 'Order marked as ready to pickup successfully!'
        );
        this.processingOrderId = null;
        this.applyTabFilter(); // Refresh the filtered list
        // Optionally reload orders to get latest data
        this.getOrders();
      },
      error: (err: any) => {
        console.error('Failed to mark order as ready to pickup', err);
        this.setError(
          err.error?.message ||
            err.error?.error ||
            'Failed to mark order as ready to pickup. Please try again.'
        );
        this.processingOrderId = null;
      },
    });
  }

  setSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  setError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  isProcessingOrder(order: any): boolean {
    const orderId = order._id || order.id;
    return this.processingOrderId === orderId;
  }

  canMarkReadyToPickup(order: any): boolean {
    return (
      this.activeTab === 'upcoming' &&
      (order.status === 'pending' || order.status === 'processing')
    );
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
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedOrders = this.filteredOrders.slice(start, end);
  }
}
