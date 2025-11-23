import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export interface CreateSubscriptionRequest {
  merchantId: string;
  storeId: string;
}

export interface SubscriptionResponse {
  subscriptionId?: string;
  _id?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  key?: string;
  name?: string;
  description?: string;
  prefill?: {
    email?: string;
    contact?: string;
  };
  [key: string]: any;
}

export interface VerifyPaymentRequest {
  subscriptionId: string;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createSubscription(
    merchantId: string,
    storeId: string
  ): Observable<SubscriptionResponse> {
    const payload: CreateSubscriptionRequest = {
      merchantId,
      storeId,
    };
    return this.http.post<SubscriptionResponse>(
      `${this.apiUrl}/api/subscriptions/create`,
      payload
    );
  }

  verifyPayment(paymentData: VerifyPaymentRequest): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/api/subscriptions/verify`,
      paymentData
    );
  }

  getSubscriptions(merchantId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/api/subscriptions/${merchantId}`
    );
  }
}

