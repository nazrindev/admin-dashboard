import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';

interface SizeInventory {
  size: string;
  quantity: number;
  reserved: number;
  sku?: string;
  isActive: boolean;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  imageUrls?: string[];
  sizes?: string[];
  inventory?: {
    type: 'legacy' | 'size-based';
    sizeInventory: SizeInventory[];
    lowStockThreshold: number;
    trackInventory: boolean;
  };
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct: Product | null = null;
  inventoryType: 'legacy' | 'size-based' = 'size-based';
  legacyStock: number = 0;
  sizeInventory: SizeInventory[] = [];
  lowStockThreshold: number = 5;
  trackInventory: boolean = true;
  inventorySummary: any = null;
  loading: boolean = false;
  searchTerm: string = '';
  inventoryFilter: string = 'all';

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalProducts: number = 0;
  productsPerPage: number = 10;

  // Math reference for template
  Math = Math;

  // Standard sizes available
  standardSizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  // Selected sizes array
  selectedSizes: string[] = [];

  newSize: SizeInventory = {
    size: '',
    quantity: 0,
    reserved: 0,
    sku: '',
    isActive: true,
  };

  constructor(private productService: ProductService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(page: number = 1) {
    this.loading = true;
    this.currentPage = page;

    console.log('Loading products for page:', page, 'search:', this.searchTerm);

    this.productService
      .getMerchantProducts(page, this.productsPerPage, this.searchTerm)
      .subscribe({
        next: (response: any) => {
          console.log('Products API response:', response);
          this.products = response.products || [];
          this.totalProducts = response.pagination?.totalProducts || 0;
          this.totalPages = response.pagination?.totalPages || 1;
          this.filteredProducts = [...this.products];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loading = false;
          // Show user-friendly error message
          alert(
            'Failed to load products. Please check your connection and try again.'
          );
        },
      });
  }

  onPageChange(page: number) {
    this.loadProducts(page);
  }

  onSearchChange() {
    // Reset to first page when searching
    this.currentPage = 1;
    this.loadProducts(1);
  }

  filterProducts() {
    // For now, we'll do client-side filtering for low stock
    // The search is handled server-side via the API
    let filtered = [...this.products];

    // Apply filter
    if (this.inventoryFilter !== 'all') {
      filtered = filtered.filter((product) => {
        if (this.inventoryFilter === 'low-stock') {
          return this.isLowStock(product);
        }
        return true;
      });
    }

    this.filteredProducts = filtered;
  }

  selectProduct(product: Product) {
    this.selectedProduct = product;
    this.loadProductInventory();
  }

  closeModal(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.selectedProduct = null;
    this.inventorySummary = null;
  }

  getInventoryStatus(product: Product): string {
    if (product.sizes && product.sizes.length > 0) {
      return `${product.sizes.length} Sizes Available`;
    }
    return 'Out of Stock';
  }

  getInventoryStatusClass(product: Product): string {
    if (product.sizes && product.sizes.length > 0) {
      return 'status-in-stock';
    }
    return 'status-out-of-stock';
  }

  getStockInfo(product: Product): string {
    if (product.sizes && product.sizes.length > 0) {
      return `${product.sizes.length} in stock`;
    }
    return 'out of stock';
  }

  isLowStock(product: Product): boolean {
    // Consider low stock if product has 2 or fewer sizes
    return !product.sizes || product.sizes.length <= 2;
  }

  loadProductInventory() {
    if (!this.selectedProduct) return;

    this.loading = true;

    // Load existing sizes from product
    this.selectedSizes = this.selectedProduct?.sizes || [];

    // Initialize size inventory based on product sizes
    this.sizeInventory = this.selectedSizes.map((size) => ({
      size: size,
      quantity: 1,
      reserved: 0,
      sku: '',
      isActive: true,
    }));

    this.lowStockThreshold = 5;
    this.trackInventory = true;

    this.loading = false;
  }

  onInventoryTypeChange() {
    if (
      this.inventoryType === 'size-based' &&
      this.sizeInventory.length === 0
    ) {
      // Initialize with current legacy stock if switching to size-based
      // Each size gets 1 unit by default
      this.sizeInventory = [
        {
          size: 'S',
          quantity: 1,
          reserved: 0,
          sku: '',
          isActive: true,
        },
        {
          size: 'M',
          quantity: 1,
          reserved: 0,
          sku: '',
          isActive: true,
        },
        {
          size: 'L',
          quantity: 1,
          reserved: 0,
          sku: '',
          isActive: true,
        },
      ];
    }
  }

  addSize() {
    if (this.newSize.size && this.newSize.quantity >= 0) {
      this.sizeInventory.push({ ...this.newSize });
      this.newSize = {
        size: '',
        quantity: 0,
        reserved: 0,
        sku: '',
        isActive: true,
      };
    }
  }

  removeSize(index: number) {
    this.sizeInventory.splice(index, 1);
  }

  updateInventory() {
    if (!this.selectedProduct) return;

    this.loading = true;

    // Update the product with the selected sizes
    const updateData = {
      sizes: this.selectedSizes,
    };

    this.productService
      .updateProduct(this.selectedProduct._id, updateData)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          alert('Sizes updated successfully!');
          // Refresh the product list
          this.loadProducts(this.currentPage);
        },
        error: (error) => {
          console.error('Error updating sizes:', error);
          this.loading = false;
          alert('Error updating sizes. Please try again.');
        },
      });
  }

  refreshInventory() {
    this.loadProductInventory();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Helper methods for size-based inventory logic
  getAvailableSizesCount(): number {
    return this.sizeInventory.filter(
      (size) => size.quantity > 0 && size.isActive
    ).length;
  }

  getSoldSizesCount(): number {
    return this.sizeInventory.filter(
      (size) => size.quantity === 0 && size.isActive
    ).length;
  }

  getTotalSizesCount(): number {
    return this.sizeInventory.filter((size) => size.isActive).length;
  }

  // Simple UI Methods
  adjustSizeQuantity(index: number, change: number) {
    this.sizeInventory[index].quantity = Math.max(
      0,
      this.sizeInventory[index].quantity + change
    );
  }

  addQuickSizes(sizes: string[]) {
    sizes.forEach((size) => {
      // Check if size already exists
      if (!this.sizeInventory.find((item) => item.size === size)) {
        this.sizeInventory.push({
          size: size,
          quantity: 1,
          reserved: 0,
          sku: '',
          isActive: true,
        });
      }
    });
  }

  getStockStatus(): string {
    const availableSizes = this.sizeInventory.filter(
      (size) => size.quantity > 0
    ).length;
    return availableSizes > 0
      ? `${availableSizes} sizes available`
      : 'Out of Stock';
  }

  getStockStatusClass(): string {
    const availableSizes = this.sizeInventory.filter(
      (size) => size.quantity > 0
    ).length;
    return availableSizes > 0 ? 'status-in-stock' : 'status-out-of-stock';
  }

  getTotalStockCount(): number {
    // For size-based inventory, total stock is the number of active sizes
    return this.sizeInventory.filter((size) => size.isActive).length;
  }

  // Simple size selection methods
  toggleSize(size: string) {
    const index = this.selectedSizes.indexOf(size);
    if (index > -1) {
      this.selectedSizes.splice(index, 1);
    } else {
      this.selectedSizes.push(size);
    }
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSizes.includes(size);
  }
}
