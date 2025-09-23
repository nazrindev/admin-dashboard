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
import { ProductService } from '../../services/product.service';
import { AuthService, User } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class ProductsComponent {
  // Form and data
  productForm!: FormGroup;
  products: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];

  // Pagination
  currentPage = 1;
  totalItems = 0;
  totalPages = 1;
  itemsPerPage = 10;
  searchTerm = '';

  // UI state
  isCreatePopupOpen = false;
  isEditPopupOpen = false;
  isSubmitting = false;
  selectedProduct: any = null;

  // UI messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // UI State
  showAdvancedOptions = false;
  openCreateModal = false;
  popupImageUrl: string | null = null;

  // File upload state
  selectedImages: File[] = [];
  previewUrls: string[] = [];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private productService: ProductService,
    private authService: AuthService,
    private categoryApi: CategoryService
  ) {}

  private setSuccess(msg: string) {
    this.successMessage = msg;
    this.errorMessage = null;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  private setError(msg: string) {
    this.errorMessage = msg;
    this.successMessage = null;
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }

  ngOnInit() {
    this.productForm = this.fb.group({
      categoryId: [''],
      name: ['', Validators.required],
      description: [''],
      price: ['', Validators.required],
      stock: ['1', Validators.min(1)],
      isActive: [true],

      // Additional fields for complete payload
      sku: [''],
      brand: [''],
      gender: [''],
      material: [''],
      occasion: [''],
      sizes: [''],
      color: [''], // Changed from 'colors'
      tags: [''],
      imageUrls: [''], // Field for image URLs
    });

    // Simplified form - no subcategory handling needed

    this.getProducts();
    this.getCategories();
  }

  private getMerchantId(): string | null {
    const user: User | (User & { _id?: string }) | null =
      this.authService.getCurrentUser() as any;
    return (user as any)?._id || (user as any)?.id || null;
  }

  getProducts() {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;

    this.productService
      .getProducts(
        merchantId,
        this.currentPage,
        this.itemsPerPage,
        this.searchTerm.toString()
      )
      .subscribe({
        next: (res) => {
          // Try different possible response structures
          this.products =
            res?.products ||
            res?.product ||
            res?.data?.products ||
            res?.data?.product ||
            [];

          // Handle pagination data - try different possible structures
          const pagination =
            res?.pagination ||
            res?.meta ||
            res?.data?.pagination ||
            res?.data?.meta;

          if (pagination) {
            this.currentPage = pagination.page || pagination.currentPage || 1;
            this.totalItems =
              pagination.total ||
              pagination.totalItems ||
              pagination.count ||
              0;
            this.totalPages =
              pagination.pages ||
              pagination.totalPages ||
              Math.ceil(this.totalItems / this.itemsPerPage) ||
              1;
            this.itemsPerPage =
              pagination.limit ||
              pagination.itemsPerPage ||
              pagination.perPage ||
              10;
          }
        },
        error: (err) => console.error('Fetch failed:', err),
      });
  }

  getCategories() {
    this.categoryApi.getCategories().subscribe({
      next: (res) => {
        this.categories = res?.categories || [];
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      },
    });
  }

  getSubcategories() {
    // Simplified - no subcategory handling needed
  }

  openCreatePopup() {
    this.productForm.reset({
      stock: 1, // Default stock to 1
      isActive: true,
      sku: this.generateUniqueSku(), // Generate unique SKU
    });
    this.showAdvancedOptions = false;
    this.selectedImages = [];
    this.previewUrls = [];
    this.isCreatePopupOpen = true;
    this.openCreateModal = true;
  }

  openEditPopup(product: any) {
    this.selectedProduct = product;
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId,
      isActive: product.isActive,
      sku: product.sku,
      brand: product.brand,
      gender: product.gender,
      material: product.material,
      occasion: product.occasion,
      sizes: Array.isArray(product.sizes)
        ? product.sizes.join(', ')
        : product.sizes,
      color: Array.isArray(product.color)
        ? product.color.join(', ')
        : product.color,
      tags: Array.isArray(product.tags)
        ? product.tags.join(', ')
        : product.tags,
      imageUrls: Array.isArray(product.imageUrls)
        ? product.imageUrls.join(', ')
        : product.imageUrls,
    });
    this.isEditPopupOpen = true;
  }

  closeCreatePopup() {
    this.isCreatePopupOpen = false;
    this.openCreateModal = false;
    this.productForm.reset();
    this.selectedImages = [];
    this.previewUrls = [];
  }

  closeEditPopup() {
    this.isEditPopupOpen = false;
    this.selectedProduct = null;
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.getProducts();
  }

  onSearch() {
    this.currentPage = 1; // Reset to first page when searching
    this.getProducts();
  }

  searchProducts() {
    this.onSearch();
  }

  generateUniqueSku(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `SKU-${timestamp}-${random}`;
  }

  async submitProduct() {
    if (this.productForm.invalid) {
      this.setError('Please fill in all required fields');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    try {
      const merchantId = this.getMerchantId();
      if (!merchantId) {
        this.setError('Merchant ID not found');
        return;
      }

      // Find category ID
      const categoryId = formValue.categoryId;

      // Build FormData with files and all product data
      const formData = new FormData();

      // Add all text fields
      formData.append('name', formValue.name);
      formData.append('price', String(Number(formValue.price)));
      formData.append('stock', String(Number(formValue.stock)));
      formData.append('categoryId', categoryId || '');
      formData.append('storeId', merchantId);
      formData.append('isActive', String(!!formValue.isActive));

      // Add optional text fields
      if (formValue.sku) formData.append('sku', formValue.sku);
      if (formValue.description)
        formData.append('description', formValue.description);
      if (formValue.brand) formData.append('brand', formValue.brand);
      if (formValue.gender) formData.append('gender', formValue.gender);
      if (formValue.material) formData.append('material', formValue.material);
      if (formValue.occasion) formData.append('occasion', formValue.occasion);

      // Handle arrays - convert to JSON strings
      if (formValue.sizes) {
        const sizesArray = String(formValue.sizes)
          .split(',')
          .map((s: string) => s.trim())
          .filter((s) => s.length > 0);
        if (sizesArray.length > 0) {
          formData.append('sizes', JSON.stringify(sizesArray));
        }
      }
      if (formValue.color) {
        const colorsArray = String(formValue.color)
          .split(',')
          .map((s: string) => s.trim())
          .filter((s) => s.length > 0);
        if (colorsArray.length > 0) {
          formData.append('color', JSON.stringify(colorsArray));
        }
      }
      if (formValue.tags) {
        const tagsArray = String(formValue.tags)
          .split(',')
          .map((s: string) => s.trim())
          .filter((s) => s.length > 0);
        if (tagsArray.length > 0) {
          formData.append('tags', JSON.stringify(tagsArray));
        }
      }

      // Add image files under 'imageUrls' key (backend expects this field name)
      this.selectedImages.forEach((file) => {
        formData.append('imageUrls', file);
      });

      // Add any manually entered image URLs as strings
      if (formValue.imageUrls) {
        const manualUrls = String(formValue.imageUrls)
          .split(',')
          .map((url: string) => url.trim())
          .filter((url: string) => url.length > 0);
        manualUrls.forEach((url) => {
          formData.append('imageUrls', url);
        });
      }

      // Send FormData to product API (browser sets multipart/form-data automatically)
      const response = await firstValueFrom(
        this.http.post<any>(
          `${environment.apiUrl}/api/merchant/${merchantId}/products`,
          formData
          // No Content-Type header - let browser set multipart/form-data
        )
      );

      if (response.success) {
        this.setSuccess('Product created successfully!');
        this.getProducts();
        this.closeCreatePopup();
      } else {
        this.setError(response.message || 'Failed to create product');
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      this.setError(err.error?.message || 'Failed to create product');
    } finally {
      this.isSubmitting = false;
    }
  }

  updateStock(product: any, newStock: number) {
    this.productService
      .updateProduct(product._id, { stock: newStock })
      .subscribe({
        next: () => {
          this.setSuccess('Stock updated successfully');
          this.getProducts();
        },
        error: (err: any) => {
          this.setError('Update stock failed');
          console.error('Update stock failed', err);
        },
      });
  }

  updateStatus(product: any, isActive: boolean) {
    this.productService.updateProduct(product._id, { isActive }).subscribe({
      next: () => {
        this.setSuccess('Status updated successfully');
        this.getProducts();
      },
      error: (err: any) => {
        this.setError('Update status failed');
        console.error('Update active failed', err);
      },
    });
  }

  deleteProduct(product: any) {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(product._id || product.id).subscribe({
        next: () => {
          this.getProducts();
        },
        error: (err) => console.error('Delete failed', err),
      });
    }
  }

  openImagePopup(imageUrl: string) {
    this.popupImageUrl = imageUrl;
  }

  closeImagePopup() {
    this.popupImageUrl = null;
  }

  saveStock(product: any) {
    this.updateStock(product, product.stock);
  }

  saveActive(product: any) {
    this.updateStatus(product, product.isActive);
  }

  // AI methods - all removed/disabled
  applyAiSuggestions(): void {
    // AI functionality removed
    return;
  }

  dismissAiSuggestions(): void {
    // AI functionality removed
    return;
  }

  analyzeProductImageManually(): void {
    // AI functionality removed
    return;
  }

  async analyzeWithGemini(): Promise<void> {
    // AI functionality removed
    return;
  }

  async analyzeImageUrls(): Promise<void> {
    // AI functionality removed
    return;
  }

  async useFallbackAnalysis(): Promise<void> {
    // AI functionality removed
    return;
  }

  removeImage(file: File) {
    this.selectedImages = this.selectedImages.filter(
      (f) =>
        f.name !== file.name || f.size !== file.size || f.type !== file.type
    );
    this.previewUrls = this.previewUrls.filter((_, index) => {
      const fileToCheck = this.selectedImages[index];
      return (
        fileToCheck &&
        (fileToCheck.name !== file.name ||
          fileToCheck.size !== file.size ||
          fileToCheck.type !== file.type)
      );
    });
  }

  onImageSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.processFiles(files);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer?.files || []);
    this.processFiles(files);
  }

  private processFiles(files: File[]) {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      this.setError('Please select only image files');
      return;
    }

    this.selectedImages = [...this.selectedImages, ...imageFiles];
    this.previewUrls = this.selectedImages.map((file) => {
      return URL.createObjectURL(file);
    });

    this.setSuccess(`${imageFiles.length} image(s) selected successfully!`);
  }
}
