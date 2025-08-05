import { Component } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environment';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule , PaginationComponent],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  products: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];

  popupImageUrl: string | null = null;
  openCreateModal = false;

  productForm!: FormGroup;
  selectedImages: File[] = [];
  currentPage = 1;
  itemsPerPage = 5;

  constructor(private http: HttpClient, private fb: FormBuilder) {}


  get paginatedProducts() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.products.slice(start, start + this.itemsPerPage);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  ngOnInit() {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', Validators.required],
      description: ['', Validators.required],
      categoryId: ['', Validators.required],
      subcategoryId: ['', Validators.required],
      stock: [0, Validators.required],
      isActive: [true],
    });

    this.getProducts();
    this.getCategories();
    this.getSubcategories();
  }

  getProducts() {
    this.http
      .get<{ products: any[] }>(`${environment.apiUrl}/product/get`)
      .subscribe({
        next: (res) => (this.products = res.products),
        error: (err) => console.error('Fetch failed:', err),
      });
  }

  getCategories() {
    this.http
      .get<{ categories: any[] }>(`${environment.apiUrl}/category/get`)
      .subscribe((res) => (this.categories = res.categories || []));
  }

  getSubcategories() {
    this.http
      .get<{ subcategory: any[] }>(`${environment.apiUrl}/subcategory/get`)
      .subscribe((res) => (this.subcategories = res.subcategory || []));
  }

  openImagePopup(url: string) {
    this.popupImageUrl = url;
  }

  closeImagePopup() {
    this.popupImageUrl = null;
  }

  openCreatePopup() {
    this.productForm.reset({
      stock: 0,
      isActive: true,
    });
    this.selectedImages = [];
    this.openCreateModal = true;
  }

  closeCreatePopup() {
    this.openCreateModal = false;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedImages = Array.from(input.files);
    }
  }

  submitProduct() {
    if (this.productForm.invalid) {
      alert('Please fill in all required fields.');
      return;
    }

    const formData = new FormData();
    const formValue = this.productForm.value;

    formData.append('name', formValue.name);
    formData.append('price', formValue.price);
    formData.append('description', formValue.description);
    formData.append('categoryId', formValue.categoryId);
    formData.append('subcategoryId', formValue.subcategoryId);
    formData.append('stock', formValue.stock);
    formData.append('isActive', formValue.isActive);

    this.selectedImages.forEach((file) => {
      formData.append('imageUrls', file);
    });

    this.http.post(`${environment.apiUrl}/product/create`, formData).subscribe({
      next: () => {
        alert('Product created successfully');
        this.getProducts();
        this.closeCreatePopup();
      },
      error: (err) => {
        console.error('Create failed:', err);
        alert('Error creating product');
      },
    });
  }
}
