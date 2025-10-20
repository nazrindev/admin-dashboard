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
import {
  AiFormFillService,
  ProductInfo,
} from '../../services/ai-form-fill.service';
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
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  isSubmitting = false;

  // preserve original images on edit
  private editingOriginalImageUrls: string[] = [];

  // UI messages
  successMessage: string | null = null;
  errorMessage: string | null = null;

  // AI Form Fill
  isAnalyzingImage = false;
  aiExtractedData: ProductInfo | null = null;
  showAiSuggestions = false;

  // UI State
  showAdvancedOptions = false;

  // File upload state
  selectedImages: File[] = [];
  previewUrls: string[] = [];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private productService: ProductService,
    private authService: AuthService,
    private categoryApi: CategoryService,
    private aiFormFillService: AiFormFillService
  ) {}

  private setSuccess(msg: string) {
    this.successMessage = this.stripEmojis(msg);
    this.errorMessage = null;
    setTimeout(() => {
      this.successMessage = null;
    }, 5000);
  }

  private setError(msg: string) {
    this.errorMessage = this.stripEmojis(msg);
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

    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      subCategoryName: [''],
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

  private generateUniqueSku(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `SKU-${timestamp}-${random}`;
  }

  private generateUniqueSearchCode(name: string): string {
    const randomNumber = Math.floor(Math.random() * 9000000) + 1000000; // 7-digit number
    return `B-${randomNumber}`;
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
    this.categoryApi.getCategories().subscribe((res) => {
      this.categories = res.categories || [];
    });
  }

  getSubcategories() {
    this.categoryApi
      .getSubcategories()
      .subscribe((res) => (this.subcategories = res.subcategory || []));
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.getProducts();
  }

  onSearch() {
    this.currentPage = 1; // Reset to first page when searching
    this.getProducts();
  }

  openCreatePopup() {
    this.openCreateModal = true;
    this.productForm.reset({
      stock: 1, // Default stock to 1
      isActive: true,
      sku: this.generateUniqueSku(), // Generate unique SKU
    });
    this.showAdvancedOptions = false;
    this.selectedImages = [];
    this.previewUrls = [];
    this.aiExtractedData = null;
    this.showAiSuggestions = false;
  }

  closeCreatePopup() {
    this.openCreateModal = false;
    this.productForm.reset();
    this.selectedImages = [];
    this.previewUrls = [];
    this.aiExtractedData = null;
    this.showAiSuggestions = false;
  }

  openEditPopup(product: any) {
    this.openCreateModal = true;
    this.productForm.patchValue({
      ...product,
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
    this.editingOriginalImageUrls = product.imageUrls
      ? product.imageUrls.slice()
      : [];
    this.selectedImages = [];
    this.previewUrls = [];
    this.aiExtractedData = null;
    this.showAiSuggestions = false;
  }

  deleteProduct(product: any) {
    const merchantId = this.getMerchantId();
    if (!merchantId) return;
    if (!confirm('Delete this product?')) return;
    this.productService.deleteProduct(product._id || product.id).subscribe({
      next: () => {
        this.setSuccess('Product deleted successfully');
        this.getProducts();
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.setError(
          `Failed to delete product: ${
            err.error?.message || err.message || 'Unknown error'
          }`
        );
      },
    });
  }

  async updateProduct(productId: string) {
    if (this.productForm.invalid) {
      this.setError('Please fill in all required fields');
      return;
    }

    const merchantId = this.getMerchantId();
    if (!merchantId) {
      this.setError('Merchant ID not found');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    try {
      // Build FormData with files and all product data
      const formData = new FormData();

      // Add all text fields
      formData.append('name', formValue.name);
      formData.append('price', String(Number(formValue.price)));
      formData.append('stock', String(Number(formValue.stock)));
      formData.append('categoryId', formValue.categoryId || '');
      formData.append('storeId', formValue.storeId || merchantId);
      formData.append('isActive', String(!!formValue.isActive));

      // Add optional text fields
      if (formValue.sku) formData.append('sku', formValue.sku);
      if (formValue.description)
        formData.append('description', formValue.description);
      if (formValue.brand) formData.append('brand', formValue.brand);
      if (formValue.gender) formData.append('gender', formValue.gender);
      if (formValue.material) formData.append('material', formValue.material);
      if (formValue.occasion) formData.append('occasion', formValue.occasion);
      // create search_code
      const search_code = this.generateUniqueSearchCode(formValue.name);
      formData.append('search_code', search_code);

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
        this.http.put<any>(
          `${environment.apiUrl}/api/product/${productId}`,
          formData
          // No Content-Type header - let browser set multipart/form-data
        )
      );

      this.isSubmitting = false;
      this.setSuccess('Product updated successfully');
      this.getProducts();
      this.closeCreatePopup();
    } catch (err: any) {
      this.isSubmitting = false;
      console.error('Product update failed:', err);

      // Check if it's a content-type error and provide fallback
      if (
        err.error?.error === 'INVALID_CONTENT_TYPE' ||
        err.error?.message?.includes('Content-Type must be application/json')
      ) {
        this.setError(
          'Backend expects JSON format. Please contact administrator to fix API configuration.'
        );
        console.warn(
          '⚠️ Backend API expects JSON but we sent FormData. This needs backend configuration fix.'
        );
      } else {
        this.setError(
          `Failed to update product: ${
            err.error?.message || err.message || 'Unknown error'
          }`
        );
      }
    }
  }

  async submitProduct() {
    if (this.productForm.invalid) {
      this.setError('Please fill in all required fields');
      return;
    }

    const merchantId = this.getMerchantId();
    if (!merchantId) {
      this.setError('Merchant ID not found');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    try {
      // Build FormData with files and all product data
      const formData = new FormData();

      // Add all text fields
      formData.append('name', formValue.name);
      formData.append('price', String(Number(formValue.price)));
      formData.append('stock', String(Number(formValue.stock)));
      formData.append('categoryId', formValue.categoryId || '');
      formData.append('storeId', formValue.storeId || merchantId);
      formData.append('isActive', String(!!formValue.isActive));
      // create search_code
      const search_code = this.generateUniqueSearchCode(formValue.name);
      formData.append('search_code', search_code);

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

      this.isSubmitting = false;
      this.setSuccess('Product created successfully');
      this.getProducts();
      this.closeCreatePopup();
    } catch (err: any) {
      this.isSubmitting = false;
      console.error('Product creation failed:', err);

      // Check if it's a content-type error and provide fallback
      if (
        err.error?.error === 'INVALID_CONTENT_TYPE' ||
        err.error?.message?.includes('Content-Type must be application/json')
      ) {
        this.setError(
          'Backend expects JSON format. Please contact administrator to fix API configuration.'
        );
        console.warn(
          '⚠️ Backend API expects JSON but we sent FormData. This needs backend configuration fix.'
        );
      } else {
        this.setError(
          `Failed to create product: ${
            err.error?.message || err.message || 'Unknown error'
          }`
        );
      }
    }
  }

  searchProducts() {
    this.onSearch(); // Use the unified search method
  }

  onImageSelected(event: any) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(Array.from(input.files));
    } else {
      console.log('No files selected');
      this.setError('No files selected. Please try again.');
    }
  }

  removeImage(fileToRemove: File) {
    const index = this.selectedImages.indexOf(fileToRemove);
    if (index > -1) {
      this.selectedImages.splice(index, 1);
      this.previewUrls.splice(index, 1);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFiles(Array.from(files));
    }
  }

  processFiles(imageFiles: File[]): void {
    // Add new files to existing ones
    this.selectedImages.push(...imageFiles);

    // Create preview URLs
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrls.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });

    // Automatically analyze the first image and fill all fields
    if (imageFiles.length > 0) {
      this.analyzeProductImage(imageFiles[0]);
    }
  }

  closeImagePopup() {
    this.popupImageUrl = null;
  }

  openImagePopup(imageUrl: string) {
    this.popupImageUrl = imageUrl;
  }

  saveStock(product: any) {
    this.productService
      .updateProduct(product._id || product.id, { stock: product.stock })
      .subscribe({
        next: () => {
          this.setSuccess('Stock updated successfully');
        },
        error: (err) => {
          console.error('Stock update failed', err);
          this.setError(
            `Failed to update stock: ${
              err.error?.message || err.message || 'Unknown error'
            }`
          );
        },
      });
  }

  saveActive(product: any) {
    this.productService
      .updateProduct(product._id || product.id, { isActive: product.isActive })
      .subscribe({
        next: () => {
          this.setSuccess('Product status updated successfully');
        },
        error: (err) => {
          console.error('Status update failed', err);
          this.setError(
            `Failed to update status: ${
              err.error?.message || err.message || 'Unknown error'
            }`
          );
        },
      });
  }

  async analyzeProductImage(imageFile: File): Promise<void> {
    // Validate image file
    const validation = this.aiFormFillService.validateImageFile(imageFile);
    if (!validation.valid) {
      this.setError(validation.error || 'Invalid image file');
      return;
    }

    this.isAnalyzingImage = true;
    this.aiExtractedData = null;
    this.showAiSuggestions = false;

    try {
      const result = await this.aiFormFillService.analyzeProductImage(
        imageFile
      );

      if (result.success && result.data) {
        this.aiExtractedData = this.sanitizeProductInfo(result.data);
        this.showAiSuggestions = true;

        // Automatically apply suggestions to fill all fields
        this.applyAiSuggestions();

        this.setSuccess(
          'AI analysis complete! All fields have been automatically filled.'
        );
      } else {
        // Check if it's a quota error and provide helpful message
        if (
          result.error?.includes('quota') ||
          result.error?.includes('QUOTA_EXCEEDED')
        ) {
          this.setError(
            'AI quota exceeded. Please try again later or fill the form manually.'
          );
        } else {
          this.setError(
            `AI analysis failed: ${result.error || 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      this.setError('Failed to analyze image. Please try again.');
    } finally {
      this.isAnalyzingImage = false;
    }
  }

  applyAiSuggestions(): void {
    if (!this.aiExtractedData) return;

    const data = this.aiExtractedData;
    const updates: any = {};

    // Apply ALL suggestions from AI data
    if (data.productName) {
      updates.name = data.productName;
    }
    if (data.description) {
      updates.description = data.description;
    }
    if (data.brand) {
      updates.brand = data.brand;
    }
    if (data.material) {
      updates.material = data.material;
    }

    // Handle color field - convert to array format if needed
    if (data.color) {
      const colors = data.color.split(',').map((c: string) => c.trim());
      updates.color = colors.join(', ');
    }

    // Handle sizes field - convert to array format if needed
    if (data.size) {
      const sizes = data.size.split(',').map((s: string) => s.trim());
      updates.sizes = sizes.join(', ');
    }

    // Use AI-extracted gender directly
    if (data.gender) {
      updates.gender = data.gender;
    }

    // Use AI-extracted occasion directly
    if (data.occasion) {
      updates.occasion = data.occasion;
    }

    // Use AI-extracted tags directly
    if (data.tags) {
      updates.tags = data.tags;
    }

    // Try to find matching category with improved matching
    if (data.category) {
      const categoryLower = data.category.toLowerCase();

      // First try exact match
      let matchingCategory = this.categories.find(
        (cat) => cat.name.toLowerCase() === categoryLower
      );

      // Then try partial match
      if (!matchingCategory) {
        matchingCategory = this.categories.find(
          (cat) =>
            cat.name.toLowerCase().includes(categoryLower) ||
            categoryLower.includes(cat.name.toLowerCase())
        );
      }

      // Finally try keyword matching
      if (!matchingCategory) {
        const categoryKeywords = {
          clothing: [
            'shirt',
            'pants',
            'dress',
            'jacket',
            'coat',
            'sweater',
            'hoodie',
          ],
          shoes: ['shoe', 'sneaker', 'boot', 'sandal', 'heel'],
          accessories: [
            'bag',
            'handbag',
            'wallet',
            'belt',
            'watch',
            'necklace',
          ],
          electronics: [
            'phone',
            'laptop',
            'tablet',
            'headphone',
            'speaker',
            'camera',
          ],
          home: ['chair', 'table', 'lamp', 'sofa', 'bed', 'desk'],
          beauty: ['makeup', 'skincare', 'perfume', 'cosmetic'],
          sports: ['gym', 'fitness', 'athletic', 'sport'],
          books: ['book', 'novel', 'magazine', 'textbook'],
          toys: ['toy', 'game', 'doll', 'puzzle'],
          food: ['food', 'snack', 'beverage', 'drink'],
          health: ['medicine', 'supplement', 'vitamin', 'health'],
          automotive: ['car', 'vehicle', 'auto', 'automotive'],
          garden: ['plant', 'garden', 'flower', 'seed'],
          office: ['office', 'stationery', 'pen', 'paper'],
        };

        for (const [categoryName, keywords] of Object.entries(
          categoryKeywords
        )) {
          if (keywords.some((keyword) => categoryLower.includes(keyword))) {
            matchingCategory = this.categories.find((cat) =>
              cat.name.toLowerCase().includes(categoryName)
            );
            if (matchingCategory) break;
          }
        }
      }

      if (matchingCategory) {
        updates.categoryId = matchingCategory._id;
      }
    }

    // Ensure price is not auto-filled and stock defaults to 1
    updates.price = this.productForm.get('price')?.value || '';
    if (!this.productForm.get('stock')?.value) {
      updates.stock = 1;
    }

    // Apply all updates (excluding price override above)
    this.productForm.patchValue(updates);

    // Don't hide suggestions immediately - let user see what was filled
    // this.showAiSuggestions = false;
  }

  private stripEmojis(text: string): string {
    if (!text) return text;
    // Remove most emoji and pictographs
    return text.replace(
      /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA70}-\u{1FAFF}]/gu,
      ''
    );
  }

  private sanitizeProductInfo(info: ProductInfo): ProductInfo {
    const sanitize = (v?: string) =>
      v ? this.stripEmojis(String(v)).trim() : v;
    return {
      ...info,
      productName: sanitize(info.productName),
      description: sanitize(info.description),
      category: sanitize(info.category),
      brand: sanitize(info.brand),
      color: sanitize(info.color),
      size: sanitize(info.size),
      material: sanitize(info.material),
      gender: sanitize(info.gender),
      occasion: sanitize(info.occasion),
      tags: sanitize(info.tags),
      // Never auto-fill price from AI
      price: undefined,
    };
  }

  dismissAiSuggestions(): void {
    this.showAiSuggestions = false;
    this.aiExtractedData = null;
  }

  analyzeProductImageManually(): void {
    if (this.selectedImages.length > 0) {
      this.analyzeProductImage(this.selectedImages[0]);
      return;
    }
    if (this.productForm.get('imageUrls')?.value) {
      this.analyzeImageUrls();
    } else {
      this.setError(
        'Please upload an image or provide an image URL to analyze.'
      );
    }
  }

  async analyzeImageUrls(): Promise<void> {
    const urls = this.productForm.get('imageUrls')?.value;
    if (!urls) {
      this.setError('Please enter at least one image URL.');
      return;
    }

    const urlArray = String(urls)
      .split(',')
      .map((url: string) => url.trim());
    const firstUrl = urlArray[0];

    this.isAnalyzingImage = true;
    this.aiExtractedData = null;
    this.showAiSuggestions = false;

    try {
      const result = await this.aiFormFillService.analyzeProductImageFromUrl(
        firstUrl
      );

      if (result.success && result.data) {
        this.aiExtractedData = result.data;
        this.showAiSuggestions = true;

        // Automatically apply suggestions to fill all fields
        this.applyAiSuggestions();

        this.setSuccess(
          '🤖 AI analysis complete! All fields have been automatically filled.'
        );
      } else {
        // Check if it's a quota error and provide helpful message
        if (
          result.error?.includes('quota') ||
          result.error?.includes('QUOTA_EXCEEDED')
        ) {
          this.setError(
            'AI quota exceeded. Please try again later or fill the form manually.'
          );
        } else {
          this.setError(
            `AI analysis failed: ${result.error || 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      this.setError('Failed to analyze image. Please try again.');
    } finally {
      this.isAnalyzingImage = false;
    }
  }
}
