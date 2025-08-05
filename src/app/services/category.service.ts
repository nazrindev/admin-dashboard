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
}

export interface CreateSubcategoryRequest {
  name: string;
  categoryId: string;
  description?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  // Category APIs
  createCategory(data: CreateCategoryRequest): Observable<{ message: string; category: Category }> {
    return this.http.post<{ message: string; category: Category }>(`${environment.apiUrl}/category/create`, data);
  }

  getCategories(): Observable<{ categories: Category[] }> {
    return this.http.get<{ categories: Category[] }>(`${environment.apiUrl}/category/get`);
  }

  updateCategory(id: string, data: Partial<CreateCategoryRequest>): Observable<{ message: string; category: Category }> {
    return this.http.put<{ message: string; category: Category }>(`${environment.apiUrl}/category/update/${id}`, data);
  }

  deleteCategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/category/delete/${id}`);
  }

  // Subcategory APIs
  createSubcategory(data: CreateSubcategoryRequest): Observable<{ message: string; subcategory: Subcategory }> {
    return this.http.post<{ message: string; subcategory: Subcategory }>(`${environment.apiUrl}/subcategory/create`, data);
  }

  getSubcategories(): Observable<{ subcategory: Subcategory[] }> {
    return this.http.get<{ subcategory: Subcategory[] }>(`${environment.apiUrl}/subcategory/get`);
  }

  updateSubcategory(id: string, data: Partial<CreateSubcategoryRequest>): Observable<{ message: string; subcategory: Subcategory }> {
    return this.http.put<{ message: string; subcategory: Subcategory }>(`${environment.apiUrl}/subcategory/update/${id}`, data);
  }

  deleteSubcategory(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/subcategory/delete/${id}`);
  }
} 