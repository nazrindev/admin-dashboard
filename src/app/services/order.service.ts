import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  getOrders(
    merchantId: string,
    params: { status?: string; storeId?: string; page?: number; limit?: number }
  ): Observable<any> {
    let httpParams = new HttpParams();
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<any>(
      `${environment.apiUrl}/api/merchant/${merchantId}/orders`,
      { params: httpParams }
    );
  }

  getOrderById(orderId: string, merchantId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/order/${orderId}`, {
      params: { merchantId },
    });
  }

  updateOrderStatus(
    orderId: string,
    merchantId: string,
    status: string
  ): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/api/order/${orderId}`, {
      status,
    });
  }
}
