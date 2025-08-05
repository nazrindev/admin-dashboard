import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService, Category, Subcategory, CreateCategoryRequest, CreateSubcategoryRequest } from '../../services/category.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  categories: Category[] = [];
  subcategories: Subcategory[] = [];
  
  // Forms
  categoryForm: FormGroup;
  subcategoryForm: FormGroup;
  
  // UI States
  showCategoryModal = false;
  showSubcategoryModal = false;
  isEditingCategory = false;
  isEditingSubcategory = false;
  selectedCategoryId: string | null = null;
  selectedCategory: Category | null = null;
  selectedSubcategory: Subcategory | null = null;
  
  // Loading states
  isLoading = false;
  isSubmitting = false;

  constructor(
    private categoryService: CategoryService,
    private fb: FormBuilder
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      isActive: [true]
    });

    this.subcategoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      categoryId: ['', Validators.required],
      description: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    
    // Load categories and subcategories in parallel
    Promise.all([
      this.categoryService.getCategories().toPromise(),
      this.categoryService.getSubcategories().toPromise()
    ]).then(([categoriesRes, subcategoriesRes]) => {
      this.categories = categoriesRes?.categories || [];
      this.subcategories = subcategoriesRes?.subcategory || [];
      this.isLoading = false;
    }).catch(error => {
      console.error('Error loading data:', error);
      this.isLoading = false;
    });
  }

  // Category Methods
  openCategoryModal(category?: Category) {
    this.isEditingCategory = !!category;
    this.selectedCategory = category || null;
    
    if (category) {
      this.categoryForm.patchValue({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive
      });
    } else {
      this.categoryForm.reset({ isActive: true });
    }
    
    this.showCategoryModal = true;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.isEditingCategory = false;
    this.selectedCategory = null;
    this.categoryForm.reset({ isActive: true });
  }

  submitCategory() {
    if (this.categoryForm.invalid) return;

    this.isSubmitting = true;
    const formData = this.categoryForm.value as CreateCategoryRequest;

    const request = this.isEditingCategory && this.selectedCategory
      ? this.categoryService.updateCategory(this.selectedCategory._id, formData)
      : this.categoryService.createCategory(formData);

    request.subscribe({
      next: (response) => {
        console.log('Category saved:', response);
        this.loadData();
        this.closeCategoryModal();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error saving category:', error);
        this.isSubmitting = false;
      }
    });
  }

  deleteCategory(category: Category) {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      this.categoryService.deleteCategory(category._id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting category:', error);
        }
      });
    }
  }

  // Subcategory Methods
  openSubcategoryModal(subcategory?: Subcategory, categoryId?: string) {
    this.isEditingSubcategory = !!subcategory;
    this.selectedSubcategory = subcategory || null;
    
    if (subcategory) {
      this.subcategoryForm.patchValue({
        name: subcategory.name,
        categoryId: subcategory.categoryId,
        description: subcategory.description || '',
        isActive: subcategory.isActive
      });
    } else {
      this.subcategoryForm.reset({ 
        isActive: true,
        categoryId: categoryId || ''
      });
    }
    
    this.showSubcategoryModal = true;
  }

  closeSubcategoryModal() {
    this.showSubcategoryModal = false;
    this.isEditingSubcategory = false;
    this.selectedSubcategory = null;
    this.subcategoryForm.reset({ isActive: true });
  }

  submitSubcategory() {
    if (this.subcategoryForm.invalid) return;

    this.isSubmitting = true;
    const formData = this.subcategoryForm.value as CreateSubcategoryRequest;

    const request = this.isEditingSubcategory && this.selectedSubcategory
      ? this.categoryService.updateSubcategory(this.selectedSubcategory._id, formData)
      : this.categoryService.createSubcategory(formData);

    request.subscribe({
      next: (response) => {
        console.log('Subcategory saved:', response);
        this.loadData();
        this.closeSubcategoryModal();
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error saving subcategory:', error);
        this.isSubmitting = false;
      }
    });
  }

  deleteSubcategory(subcategory: Subcategory) {
    if (confirm(`Are you sure you want to delete "${subcategory.name}"?`)) {
      this.categoryService.deleteSubcategory(subcategory._id).subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting subcategory:', error);
        }
      });
    }
  }

  // Helper Methods
  getSubcategoriesForCategory(categoryId: string): Subcategory[] {
    return this.subcategories.filter(sub => sub.categoryId === categoryId);
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(cat => cat._id === categoryId);
    return category?.name || 'Unknown Category';
  }

  toggleCategorySelection(categoryId: string) {
    this.selectedCategoryId = this.selectedCategoryId === categoryId ? null : categoryId;
  }
} 