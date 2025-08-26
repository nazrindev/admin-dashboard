import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  constructor(private http: HttpClient) {}

  getCustomers(
    merchantId: string,
    params: { storeId?: string; page?: number; limit?: number }
  ): Observable<any> {
    let httpParams = new HttpParams();
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId);
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    return this.http.get<any>(
      `${environment.apiUrl}/api/merchant/${merchantId}/customers`,
      { params: httpParams }
    );
  }

  createCustomer(merchantId: string, payload: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/api/merchant/${merchantId}/customers`,
      payload
    );
  }
}
