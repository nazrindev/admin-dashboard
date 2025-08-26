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
  styleUrl: './products.component.scss',
})
export class ProductsComponent {
  products: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];
  openAddCategoryPopup: boolean = false;
  popupImageUrl: string | null = null;
  openCreateModal = false;
  searchTerm: String = '';
  productForm!: FormGroup;
  categoryForm!: FormGroup;
  selectedImages: File[] = [];
  currentPage = 1;
  itemsPerPage = 10;
  isSubmitting = false;

  // Inline create inputs
  newCategoryName = '';
  newSubcategoryName = '';
  existingImageUrls = '';

  // preserve original images on edit
  private editingOriginalImageUrls: string[] = [];

  // UI messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

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
      if (this.successMessage === msg) this.successMessage = null;
    }, 3000);
  }
  private setError(msg: string) {
    this.errorMessage = msg;
    this.successMessage = null;
  }

  get paginatedProducts() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.products.slice(start, start + this.itemsPerPage);
  }

  onPageChange(page: number) {
    this.currentPage = page;
  }

  ngOnInit() {
    this.productForm = this.fb.group({
      categoryId: [''],
      subcategoryId: [''],
      storeId: [''],
      name: ['', Validators.required],
      description: [''],
      price: ['', Validators.required],
      stock: ['0', Validators.min(0)],
      isActive: [true],

      brand: [''],
      sku: [''],
      color: [''],
      sizes: [''],
      material: [''],
      occasion: [''],
      gender: [''],
      careInstructions: [''],
      tags: [''],
    });

    this.categoryForm = this.fb.group({
      name: [''],
      slug: [''],
      iconUrl: [''],
      displayOrder: [0],
      isActive: [true],
      subCategoryName: [''],
    });

    this.productForm.get('categoryId')?.valueChanges.subscribe((id: string) => {
      if (!id) {
        this.subcategories = [];
        return;
      }
      this.loadSubcategoriesForCategory(id);
    });

    this.getProducts();
    this.getCategories();
    this.getSubcategories();
  }

  private getMerchantId(): string | null {
    const user: User | (User & { _id?: string }) | null =
      this.authService.getCurrentUser() as any;
    return (user as any)?._id || (user as any)?.id || null;
  }

  getProducts() {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;
    this.productService.getProducts(merchantId).subscribe({
      next: (res) => (this.products = res?.products || res?.product || []),
      error: (err) => console.error('Fetch failed:', err),
    });
  }

  getCategories() {
    this.categoryApi
      .getCategories()
      .subscribe((res) => (this.categories = res.categories || []));
  }

  getSubcategories() {
    this.categoryApi
      .getSubcategories()
      .subscribe((res) => (this.subcategories = res.subcategory || []));
  }

  private loadSubcategoriesForCategory(id: string) {
    this.categoryApi.getSubcategoriesByCategoryId(id).subscribe({
      next: (res) => {
        this.subcategories = res?.subcategories || [];
      },
      error: (err) =>
        console.error('Failed to load subcategories for category', err),
    });
  }

  openCreatePopup() {
    this.productForm.reset({
      stock: 0,
      isActive: true,
    });
    this.newCategoryName = '';
    this.newSubcategoryName = '';
    this.existingImageUrls = '';
    this.selectedImages = [];
    this.openCreateModal = true;
  }

  openEditPopup(product: any) {
    this.openCreateModal = true;
    this.productForm.patchValue({
      categoryId: product.categoryId || product.category?._id || '',
      subcategoryId: product.subcategoryId || product.subcategory?._id || '',
      storeId: product.storeId || '',
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      stock: product.stock ?? 0,
      isActive: !!product.isActive,
      brand: product.brand || '',
      sku: product.sku || '',
      color: Array.isArray(product.color)
        ? product.color.join(', ')
        : product.color || '',
      sizes: Array.isArray(product.sizes)
        ? product.sizes.join(', ')
        : product.sizes || '',
      material: product.material || '',
      occasion: product.occasion || '',
      gender: product.gender || '',
      careInstructions: product.careInstructions || '',
      tags: Array.isArray(product.tags)
        ? product.tags.join(', ')
        : product.tags || '',
    });
    (this.productForm as any)._editingId = product._id || product.id;
    this.newCategoryName = '';
    this.newSubcategoryName = '';
    this.editingOriginalImageUrls = Array.isArray(product.imageUrls)
      ? product.imageUrls.slice()
      : [];
    this.existingImageUrls = this.editingOriginalImageUrls.length
      ? this.editingOriginalImageUrls.join(', ')
      : '';
    this.selectedImages = [];
  }

  closeCreatePopup() {
    this.openCreateModal = false;
    (this.productForm as any)._editingId = undefined;
  }

  deleteProduct(product: any) {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;
    if (!confirm('Delete this product?')) return;
    this.productService.deleteProduct(product._id || product.id).subscribe({
      next: () => {
        this.getProducts();
      },
      error: (err) => console.error('Delete failed', err),
    });
  }

  // Helper: convert selected files to images payload
  private async filesToImagesPayload(files: File[]): Promise<any[]> {
    const readers = files.map(
      (file) =>
        new Promise<{ data: string; fileName: string }>((resolve, reject) => {
          const fr = new FileReader();
          fr.onerror = () => reject(new Error('Failed to read file'));
          fr.onload = () =>
            resolve({ data: String(fr.result), fileName: file.name });
          fr.readAsDataURL(file);
        })
    );
    return Promise.all(readers);
  }

  async submitProduct() {
    if (this.productForm.invalid) {
      this.setError('Please fill in all required fields.');
      return;
    }
    this.isSubmitting = true;

    const formValue = this.productForm.value;
    let categoryId: string | null = formValue.categoryId || null;

    // If user typed a new category, create it first
    try {
      if (!categoryId && this.newCategoryName.trim()) {
        const created = await firstValueFrom(
          this.categoryApi.createCategory({
            name: this.newCategoryName.trim(),
            isActive: true,
          })
        );
        categoryId = created?.category?._id || categoryId;
      }

      // If user typed a new subcategory, create it once we have a categoryId
      let subcategoryId: string | null = formValue.subcategoryId || null;
      if (this.newSubcategoryName.trim()) {
        if (!categoryId) {
          this.isSubmitting = false;
          this.setError(
            'Please select or create a category before adding a subcategory.'
          );
          return;
        }
        const createdSub = await firstValueFrom(
          this.categoryApi.createSubcategory({
            name: this.newSubcategoryName.trim(),
            categoryId: categoryId as string,
            isActive: true,
          })
        );
        subcategoryId = createdSub?.subcategory?._id || subcategoryId;
      }

      // Prepare images
      const existingUrls = String(this.existingImageUrls || '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => !!s);
      const images = this.selectedImages.length
        ? await this.filesToImagesPayload(this.selectedImages)
        : [];

      // Construct payload in JSON
      const payload: any = {
        name: formValue.name,
        sku: formValue.sku || undefined,
        price: Number(formValue.price),
        stock: Number(formValue.stock),
        categoryId: categoryId,
        subcategoryId: subcategoryId || undefined,
        storeId: formValue.storeId || undefined,
        brand: formValue.brand || undefined,
        description: formValue.description,
        gender: formValue.gender || undefined,
        sizes: formValue.sizes
          ? String(formValue.sizes)
              .split(',')
              .map((s: string) => s.trim())
          : undefined,
        color: formValue.color
          ? String(formValue.color)
              .split(',')
              .map((s: string) => s.trim())
          : undefined,
        material: formValue.material || undefined,
        occasion: formValue.occasion || undefined,
        tags: formValue.tags
          ? String(formValue.tags)
              .split(',')
              .map((s: string) => s.trim())
          : undefined,
        isActive: !!formValue.isActive,
        imageUrls: undefined as any,
      };

      // Build imageUrls: keep existing/old + new uploads as data URLs
      const uploadedDataUrls = images.map((i) => i.data);
      if (existingUrls.length) {
        payload.imageUrls = existingUrls.concat(uploadedDataUrls);
      } else if (
        (this.productForm as any)._editingId &&
        this.editingOriginalImageUrls.length
      ) {
        payload.imageUrls =
          this.editingOriginalImageUrls.concat(uploadedDataUrls);
      } else if (uploadedDataUrls.length) {
        payload.imageUrls = uploadedDataUrls;
      } else {
        delete payload.imageUrls;
      }

      const merchantId = this.getMerchantId();
      if (!merchantId) {
        this.isSubmitting = false;
        this.setError('No merchant logged in');
        return;
      }

      const editingId = (this.productForm as any)._editingId as
        | string
        | undefined;
      const request$ = editingId
        ? this.productService.updateProduct(editingId, payload)
        : this.productService.createProduct(merchantId, payload);

      await firstValueFrom(request$);

      this.isSubmitting = false;
      this.setSuccess(
        editingId
          ? 'Product updated successfully'
          : 'Product created successfully'
      );
      this.getProducts();
      this.closeCreatePopup();
    } catch (err: any) {
      this.isSubmitting = false;
      const apiMsg = err?.error?.message || 'Error saving product';
      this.setError(apiMsg);
      console.error('Save failed:', err);
    }
  }

  saveStock(product: any) {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;
    const stock = Number(product.stock) || 0;
    this.productService
      .updateStock(merchantId, product._id || product.id, stock)
      .subscribe({
        next: () => {
          this.setSuccess('Stock updated');
        },
        error: (err) => {
          this.setError('Update stock failed');
          console.error('Update stock failed', err);
        },
      });
  }

  saveActive(product: any) {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;
    this.productService
      .updateProduct(product._id || product.id, {
        isActive: !!product.isActive,
      })
      .subscribe({
        next: () => {
          this.setSuccess('Status updated');
        },
        error: (err) => {
          this.setError('Update status failed');
          console.error('Update active failed', err);
        },
      });
  }

  searchProducts() {
    const term = String(this.searchTerm || '').trim();
    if (!term) {
      this.getProducts();
      return;
    }
    this.http
      .get(`${environment.apiUrl}/product/search`, { params: { q: term } })
      .subscribe({
        next: (response: any) => {
          this.products = response.products || [];
        },
        error: (err) => console.error('Error searching products:', err),
      });
  }

  openImagePopup(url: string | null | undefined) {
    if (!url) return;
    this.popupImageUrl = url;
  }

  closeImagePopup() {
    this.popupImageUrl = null;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedImages = Array.from(input.files);
    }
  }

  removeImage(file: File) {
    this.selectedImages = this.selectedImages.filter(
      (f) =>
        f.name !== file.name || f.size !== file.size || f.type !== file.type
    );
  }
}
