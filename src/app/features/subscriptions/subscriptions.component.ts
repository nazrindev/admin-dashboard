import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { AuthService } from '../../services/auth.service';
import { StoreService } from '../../services/store.service';

declare var Razorpay: any;

interface Subscription {
  _id?: string;
  merchantId: string;
  storeId: string;
  status: 'active' | 'inactive' | 'expired' | 'pending';
  plan?: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
})
export class SubscriptionsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  loading = false;
  processing = false;
  errorMessage = '';
  successMessage = '';
  selectedStoreId: string | null = null;
  stores: any[] = [];
  razorpayLoaded = false;
  currentSubscriptionId: string | null = null; // Store subscriptionId from create response
  currentOrderId: string | null = null; // Store orderId from create response

  isRenewal = false;
  renewalStoreName = '';

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private storeService: StoreService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRazorpayScript();
    this.loadStores();
    this.loadSubscriptions();

    // Check if this is a renewal flow
    this.route.queryParams.subscribe((params) => {
      if (params['storeId']) {
        this.selectedStoreId = params['storeId'];
        this.isRenewal = params['renew'] === 'true';
        // Get store name for display
        if (this.selectedStoreId) {
          this.storeService.getStore(this.selectedStoreId).subscribe({
            next: (store) => {
              this.renewalStoreName = store.businessName;
            },
            error: (error) => {
              console.error('Error loading store:', error);
            },
          });
        }
      }
    });
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  private loadRazorpayScript(): void {
    if (this.razorpayLoaded) return;

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      this.razorpayLoaded = true;
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      this.setError('Failed to load payment gateway. Please refresh the page.');
    };
    document.body.appendChild(script);
  }

  private getMerchantId(): string | null {
    const user = this.authService.getCurrentUser();
    return (user as any)?._id || (user as any)?.id || null;
  }

  private getStoreId(): string | null {
    if (this.selectedStoreId) {
      return this.selectedStoreId;
    }

    // Try to get from localStorage
    const currentStoreStr = localStorage.getItem('currentStore');
    if (currentStoreStr) {
      try {
        const currentStore = JSON.parse(currentStoreStr);
        return currentStore._id || currentStore.id || null;
      } catch (e) {
        console.error('Error parsing currentStore:', e);
      }
    }

    // Use first store if available
    if (this.stores.length > 0) {
      return this.stores[0]._id || this.stores[0].id || null;
    }

    return null;
  }

  loadStores(): void {
    const merchantId = this.getMerchantId();
    if (!merchantId) {
      this.setError('Merchant ID not found. Please login again.');
      return;
    }

    this.storeService.getStores(merchantId).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.stores = response;
        } else if (response?.stores && Array.isArray(response.stores)) {
          this.stores = response.stores;
        } else if (response?.data && Array.isArray(response.data)) {
          this.stores = response.data;
        } else {
          this.stores = [];
        }

        // Auto-select first store if none selected
        if (!this.selectedStoreId && this.stores.length > 0) {
          this.selectedStoreId =
            this.stores[0]._id || this.stores[0].id || null;
        }
      },
      error: (error) => {
        console.error('Error loading stores:', error);
        this.setError('Failed to load stores');
      },
    });
  }

  loadSubscriptions(): void {
    const merchantId = this.getMerchantId();
    if (!merchantId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.subscriptionService.getSubscriptions(merchantId).subscribe({
      next: (response) => {
        if (Array.isArray(response)) {
          this.subscriptions = response;
        } else if (
          response?.subscriptions &&
          Array.isArray(response.subscriptions)
        ) {
          this.subscriptions = response.subscriptions;
        } else if (response?.data && Array.isArray(response.data)) {
          this.subscriptions = response.data;
        } else {
          this.subscriptions = [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subscriptions:', error);
        this.setError(error.error?.message || 'Failed to load subscriptions');
        this.loading = false;
        this.subscriptions = [];
      },
    });
  }

  onSubscribe(): void {
    const merchantId = this.getMerchantId();
    const storeId = this.getStoreId();

    if (!merchantId) {
      this.setError('Merchant ID not found. Please login again.');
      return;
    }

    if (!storeId) {
      this.setError('Please select a store to subscribe.');
      return;
    }

    if (!this.razorpayLoaded) {
      this.setError(
        'Payment gateway is still loading. Please wait a moment and try again.'
      );
      return;
    }

    this.processing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.subscriptionService.createSubscription(merchantId, storeId).subscribe({
      next: (response) => {
        // Store subscriptionId and orderId from response for verification
        this.currentSubscriptionId =
          response.subscriptionId || response._id || null;
        this.currentOrderId = response.orderId || response['id'] || null;
        if (!this.currentSubscriptionId) {
          console.warn('No subscriptionId in response:', response);
        }
        if (!this.currentOrderId) {
          console.warn('No orderId in response:', response);
        }
        this.openRazorpayCheckout(response);
      },
      error: (error) => {
        console.error('Error creating subscription:', error);
        this.setError(
          error.error?.message || 'Failed to create subscription order'
        );
        this.processing = false;
      },
    });
  }

  private openRazorpayCheckout(orderData: any): void {
    if (typeof Razorpay === 'undefined') {
      this.setError('Razorpay SDK not loaded. Please refresh the page.');
      this.processing = false;
      return;
    }

    const orderId = orderData.orderId || orderData.id;
    const subscriptionId = this.currentSubscriptionId;

    const options = {
      key: orderData.key || orderData.razorpayKey,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: orderData.name || 'Merchant Admin',
      description: orderData.description || 'Subscription Payment',
      order_id: orderId,
      notes: subscriptionId
        ? {
            subscriptionId: subscriptionId,
          }
        : {},
      handler: (response: any) => {
        this.handlePaymentSuccess(response);
      },
      prefill: {
        email: orderData.prefill?.email || '',
        contact: orderData.prefill?.contact || '',
      },
      theme: {
        color: '#3b82f6',
      },
      modal: {
        ondismiss: () => {
          this.processing = false;
          this.currentSubscriptionId = null; // Reset subscriptionId if modal is dismissed
          this.currentOrderId = null; // Reset orderId if modal is dismissed
        },
      },
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  }

  private handlePaymentSuccess(paymentResponse: any): void {
    this.processing = true;

    // Check if we have subscriptionId
    if (!this.currentSubscriptionId) {
      this.setError('Subscription ID not found. Please try subscribing again.');
      this.processing = false;
      return;
    }

    // Check if we have payment ID
    if (!paymentResponse.razorpay_payment_id) {
      this.setError('Payment ID not found in response. Please try again.');
      this.processing = false;
      return;
    }

    // Use the stored order ID from subscription creation, or fallback to payment response order ID
    const orderId = this.currentOrderId || paymentResponse.razorpay_order_id;

    const verifyData = {
      subscriptionId: this.currentSubscriptionId,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpayOrderId: orderId,
      razorpaySignature: paymentResponse.razorpay_signature,
    };

    this.subscriptionService.verifyPayment(verifyData).subscribe({
      next: (response) => {
        this.setSuccess('Subscription activated successfully!');
        this.processing = false;
        this.currentSubscriptionId = null; // Reset after successful verification
        this.currentOrderId = null; // Reset after successful verification
        // Reload subscriptions to show updated status
        this.loadSubscriptions();
      },
      error: (error) => {
        console.error('Error verifying payment:', error);
        this.setError(
          error.error?.message ||
            'Payment verification failed. Please contact support.'
        );
        this.processing = false;
        this.currentSubscriptionId = null; // Reset on error
        this.currentOrderId = null; // Reset on error
      },
    });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'expired':
        return 'status-expired';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-inactive';
    }
  }

  getActiveSubscriptionForStore(storeId: string | null): Subscription | null {
    if (!storeId || !this.subscriptions.length) {
      return null;
    }
    return (
      this.subscriptions.find((sub) => {
        const subStoreId =
          typeof sub.storeId === 'string'
            ? sub.storeId
            : (sub.storeId as any)?._id || sub.storeId;
        return subStoreId === storeId && sub.status === 'active';
      }) || null
    );
  }

  hasActiveSubscription(): boolean {
    return this.getActiveSubscriptionForStore(this.selectedStoreId) !== null;
  }

  setError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  setSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }
}
