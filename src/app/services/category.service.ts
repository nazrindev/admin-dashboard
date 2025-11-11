import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  categoryId: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  storeId?: string;
  storeSlug?: string;
}

export interface CreateSubcategoryRequest {
  name: string;
  categoryId: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  // Category APIs
  createCategory(
    data: CreateCategoryRequest
  ): Observable<{ message: string; category: Category }> {
    return this.http.post<{ message: string; category: Category }>(
      `${environment.apiUrl}/api/category`,
      data
    );
  }

  getCategories(): Observable<{ categories: Category[] }> {
    return this.http.get<{ categories: Category[] }>(
      `${environment.apiUrl}/api/category/get`
    );
  }

  updateCategory(
    id: string,
    data: Partial<CreateCategoryRequest>
  ): Observable<{ message: string; category: Category }> {
    return this.http.put<{ message: string; category: Category }>(
      `${environment.apiUrl}/api/category/update/${id}`,
      data
    );
  }

  deleteCategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/api/category/delete/${id}`
    );
  }

  // Subcategory APIs
  createSubcategory(
    data: CreateSubcategoryRequest
  ): Observable<{ message: string; subcategory: Subcategory }> {
    return this.http.post<{ message: string; subcategory: Subcategory }>(
      `${environment.apiUrl}/api/subcategory`,
      data
    );
  }

  getSubcategories(): Observable<{ subcategory: Subcategory[] }> {
    return this.http.get<{ subcategory: Subcategory[] }>(
      `${environment.apiUrl}/api/subcategory/get`
    );
  }

  updateSubcategory(
    id: string,
    data: Partial<CreateSubcategoryRequest>
  ): Observable<{ message: string; subcategory: Subcategory }> {
    return this.http.put<{ message: string; subcategory: Subcategory }>(
      `${environment.apiUrl}/subcategory/update/${id}`,
      data
    );
  }

  deleteSubcategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/subcategory/delete/${id}`
    );
  }

  // New endpoints per spec
  getCategoryById(id: string): Observable<{ category: Category }> {
    return this.http.get<{ category: Category }>(
      `${environment.apiUrl}/api/category/${id}`
    );
  }

  getSubcategoriesByCategoryId(
    id: string
  ): Observable<{ subcategories: Subcategory[] }> {
    return this.http.get<{ subcategories: Subcategory[] }>(
      `${environment.apiUrl}/api/category/${id}/subcategories`
    );
  }
}
