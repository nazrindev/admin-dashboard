import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(
    merchantId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Observable<any> {
    let url = `${environment.apiUrl}/api/merchant/${merchantId}/products?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    return this.http.get<any>(url);
  }

  createProduct(merchantId: string, payload: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/api/product/create`,
      payload
    );
  }

  // Updated per API_README: /api/product/{productId}
  updateProduct(productId: string, payload: any): Observable<any> {
    return this.http.put<any>(
      `${environment.apiUrl}/api/product/update/${productId}`,
      payload
    );
  }

  updateStock(
    merchantId: string,
    productId: string,
    stock: number
  ): Observable<any> {
    return this.updateProduct(productId, { stock });
  }

  // Updated per API_README: /api/product/{productId}
  deleteProduct(productId: string): Observable<any> {
    return this.http.delete<any>(
      `${environment.apiUrl}/api/product/delete/${productId}`
    );
  }
}
