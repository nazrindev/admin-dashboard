import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private http: HttpClient, private authService: AuthService) {}

  getProducts(
    merchantId: string,
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Observable<any> {
    let url = `${environment.apiUrl}/api/merchant/${merchantId}/products`;
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) {
      params.append('search', search);
    }
    url += `?${params.toString()}`;
    return this.http.get<any>(url);
  }

  createProduct(merchantId: string, payload: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/api/product/create`,
      payload
    );
  }

  // Get product by ID - GET /api/product/{productId}
  getProductById(productId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/product/${productId}`);
  }

  // Update product - PUT /api/product/{productId}
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

  // Delete product - DELETE /api/product/{productId}
  deleteProduct(productId: string): Observable<any> {
    return this.http.delete<any>(
      `${environment.apiUrl}/api/product/${productId}`
    );
  }

  // Get merchant products
  getMerchantProducts(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Observable<any> {
    const merchantId = this.getMerchantId();
    console.log(
      'Getting merchant products for merchantId:',
      merchantId,
      'page:',
      page,
      'limit:',
      limit,
      'search:',
      search
    );

    if (!merchantId) {
      throw new Error('Merchant ID not found. Please log in again.');
    }
    return this.getProducts(merchantId, page, limit, search);
  }

  private getMerchantId(): string | null {
    const user = this.authService.getCurrentUser();
    console.log('Current user:', user);
    const merchantId = (user as any)?._id || (user as any)?.id || null;
    console.log('Extracted merchantId:', merchantId);
    return merchantId;
  }

  // Inventory Management Methods
  getInventory(productId: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/api/product/${productId}/inventory`
    );
  }

  updateInventory(productId: string, inventoryData: any): Observable<any> {
    return this.http.put<any>(
      `${environment.apiUrl}/api/product/${productId}/inventory`,
      inventoryData
    );
  }

  checkAvailability(
    productId: string,
    size?: string,
    quantity: number = 1
  ): Observable<any> {
    const body: any = { quantity };
    if (size) {
      body.size = size;
    }
    return this.http.post<any>(
      `${environment.apiUrl}/api/product/${productId}/availability`,
      body
    );
  }
}
