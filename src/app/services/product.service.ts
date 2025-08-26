import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(merchantId: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/api/merchant/${merchantId}/products`
    );
  }

  createProduct(merchantId: string, payload: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/api/merchant/${merchantId}/products`,
      payload
    );
  }

  // Updated per API_README: /api/product/{productId}
  updateProduct(productId: string, payload: any): Observable<any> {
    return this.http.put<any>(
      `${environment.apiUrl}/api/product/${productId}`,
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
      `${environment.apiUrl}/api/product/${productId}`
    );
  }
}
