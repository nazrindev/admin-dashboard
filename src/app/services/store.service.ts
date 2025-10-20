import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export interface Store {
  _id: string;
  merchantId: string;
  businessName: string;
  address?: string;
  phone?: string;
  logo?: string;
  coverImage?: string; // Added for cover image
  website?: string;
  description?: string;
  type?: string;
  rating: number;
  openTime?: string;
  closeTime?: string;
  supportDelivery: boolean;
  sameDayDelivery: boolean;
  verified: boolean;
  featured: boolean;
  featuredExpiry?: string;
  location?: {
    type: string;
    coordinates: number[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedStoreRequest {
  storeId: string;
  featured: boolean;
  paymentMethod?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StoreService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStores(merchantId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/api/merchant/${merchantId}/stores`
    );
  }

  getStore(storeId: string): Observable<Store> {
    return this.http.get<Store>(`${this.apiUrl}/api/store/${storeId}`);
  }

  createStore(storeData: any): Observable<Store> {
    return this.http.post<Store>(`${this.apiUrl}/api/store`, storeData);
  }

  createStoreWithFormData(formData: FormData): Observable<Store> {
    return this.http.post<Store>(`${this.apiUrl}/api/store`, formData);
  }

  updateStore(storeId: string, storeData: any): Observable<Store> {
    return this.http.put<Store>(
      `${this.apiUrl}/api/store/${storeId}`,
      storeData
    );
  }

  updateStoreWithFormData(
    storeId: string,
    formData: FormData
  ): Observable<Store> {
    return this.http.put<Store>(
      `${this.apiUrl}/api/store/${storeId}`,
      formData
    );
  }

  toggleFeatured(
    storeId: string,
    featured: boolean,
    paymentMethod?: string
  ): Observable<any> {
    const payload: FeaturedStoreRequest = {
      storeId,
      featured,
      paymentMethod,
    };
    return this.http.post(`${this.apiUrl}/api/store/featured`, payload);
  }

  getFeaturedStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.apiUrl}/api/stores/featured`);
  }

  submitApprovalRequest(request: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/store/approval-request`, request);
  }

  getApprovalRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/admin/approval-requests`);
  }

  approveRequest(
    requestId: string,
    status: string,
    adminNotes?: string
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/api/admin/approval-requests/${requestId}`,
      {
        status,
        adminNotes,
      }
    );
  }
}
