import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { ProductService } from '../../../services/product.service';
import { AuthService, User } from '../../../services/auth.service';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    price: number;
    imageUrls?: string[];
    sizes?: string[];
    description?: string;
  };
  quantity: number;
  price: number;
  size?: string; // size that was ordered
}

interface Order {
  _id: string;
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  store?: {
    _id: string;
    name: string;
  };
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  placedAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const orderId = params['id'];
      if (orderId) {
        this.loadOrderDetail(orderId);
      }
    });
  }

  private getMerchantId(): string | null {
    const user: User | (User & { _id?: string }) | null =
      this.authService.getCurrentUser() as any;
    return (user as any)?._id || (user as any)?.id || null;
  }

  loadOrderDetail(orderId: string) {
    this.loading = true;
    this.error = '';

    const merchantId = this.getMerchantId();
    if (!merchantId) {
      this.error = 'Merchant not found';
      this.loading = false;
      return;
    }

    this.orderService.getOrderById(orderId, merchantId).subscribe({
      next: (response) => {
        this.order = response.order || response;

        if (!this.order) {
          this.error = 'Order not found';
        } else {
          // Load detailed product information for each item
          this.loadProductDetails();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.error = 'Failed to load order details';
        this.loading = false;
      },
    });
  }

  loadProductDetails() {
    if (!this.order) return;

    this.order.items.forEach((item) => {
      this.productService.getProductById(item.product._id).subscribe({
        next: (product: any) => {
          item.product = {
            ...item.product,
            ...product,
            imageUrls: product.imageUrls || [],
            sizes: product.sizes || [],
          };
        },
        error: (error: any) => {
          console.error('Error loading product details:', error);
        },
      });
    });
  }

  updateOrderStatus(status: string) {
    if (!this.order) return;

    const merchantId = this.getMerchantId();
    if (!merchantId) return;

    this.orderService
      .updateOrderStatus(this.order._id, merchantId, status)
      .subscribe({
        next: () => {
          if (this.order) {
            this.order.status = status as any;
          }
        },
        error: (error) => {
          console.error('Failed to update order status:', error);
          alert('Failed to update order status');
        },
      });
  }

  goBack() {
    this.router.navigate(['/orders']);
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  getPaymentStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  calculateSubtotal(): number {
    if (!this.order || !this.order.items) return 0;
    return this.order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
  }

  calculateTax(): number {
    const subtotal = this.calculateSubtotal();
    // If totalAmount includes tax, calculate tax as difference
    // Otherwise, assume 18% GST (common in India)
    if (this.order && this.order.totalAmount) {
      const tax = this.order.totalAmount - subtotal;
      return tax > 0 ? tax : subtotal * 0.18;
    }
    return subtotal * 0.18; // 18% GST
  }

  getTotalAmount(): number {
    if (this.order && this.order.totalAmount) {
      return this.order.totalAmount;
    }
    return this.calculateSubtotal() + this.calculateTax();
  }
}
