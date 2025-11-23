import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { StoreService, Store } from '../../services/store.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  storeForm: FormGroup;
  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  selectedCoverImage: File | null = null;
  coverImagePreview: string | null = null;
  selectedLogoImage: File | null = null;
  logoImagePreview: string | null = null;
  currentStore: Store | null = null;

  constructor(
    private fb: FormBuilder,
    private storeService: StoreService,
    private authService: AuthService
  ) {
    this.storeForm = this.fb.group({
      businessName: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.maxLength(500)]],
      address: [''],
      city: [''],
      state: [''],
      pincode: [''],
      phone: [''], // Removed strict validation for now
      website: [''], // Removed strict validation for now
      type: [''],
      openTime: [''],
      closeTime: [''],
      supportDelivery: [false],
      sameDayDelivery: [false],
      location: this.fb.group({
        coordinates: [[0, 0]],
      }),
    });
  }

  ngOnInit() {
    console.log('Settings component initialized');
    this.loadStoreDetails();

    // Debug form validity
    this.storeForm.statusChanges.subscribe((status) => {
      console.log('Form status:', status);
      if (status === 'INVALID') {
        console.log('Form errors:', this.getFormErrors());
      }
    });
  }

  getFormErrors() {
    const errors: any = {};
    Object.keys(this.storeForm.controls).forEach((key) => {
      const control = this.storeForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  loadStoreDetails() {
    console.log('Loading store details...');
    this.loading = true;
    const merchantId = this.getMerchantId();
    console.log('Merchant ID:', merchantId);

    this.storeService.getStores(merchantId).subscribe({
      next: (response) => {
        // Handle both array response and object with stores property
        let stores = [];
        if (Array.isArray(response)) {
          stores = response;
        } else if (
          response &&
          response.stores &&
          Array.isArray(response.stores)
        ) {
          stores = response.stores;
        } else if (response && Array.isArray(response.data)) {
          stores = response.data;
        }

        if (stores.length > 0) {
          this.currentStore = stores[0]; // Use first store for now
          this.populateForm(this.currentStore);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading store details:', error);
        this.setError('Failed to load store details');
        this.loading = false;
      },
    });
  }

  populateForm(store: Store | null) {
    if (!store) return;

    this.storeForm.patchValue({
      businessName: store.businessName || '',
      description: store.description || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      pincode: store.pincode || '',
      phone: store.phone || '',
      website: store.website || '',
      type: store.type || '',
      openTime: store.openTime || '',
      closeTime: store.closeTime || '',
      supportDelivery: store.supportDelivery || false,
      sameDayDelivery: store.sameDayDelivery || false,
      location: {
        coordinates: store.location?.coordinates || [0, 0],
      },
    });

    // Set image previews from stored URLs
    if (store.logo) {
      this.logoImagePreview = store.logo;
    }
    if (store.coverImage) {
      this.coverImagePreview = store.coverImage;
    }
  }

  onCoverImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedCoverImage = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.coverImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  onLogoImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedLogoImage = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoImagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeCoverImage() {
    this.selectedCoverImage = null;
    this.coverImagePreview = null;
  }

  removeLogoImage() {
    this.selectedLogoImage = null;
    this.logoImagePreview = null;
  }

  // Method to update only the logo
  async updateLogoOnly() {
    if (!this.selectedLogoImage) {
      this.setError('Please select a logo image first');
      return;
    }

    if (!this.currentStore || !this.currentStore._id) {
      this.setError('Store not found');
      return;
    }

    this.saving = true;
    const formData = new FormData();
    formData.append('logo', this.selectedLogoImage);

    console.log('Updating logo only:', {
      storeId: this.currentStore._id,
      logoFile: this.selectedLogoImage.name,
    });

    this.storeService
      .updateStoreWithFormData(this.currentStore._id, formData)
      .subscribe({
        next: (response) => {
          this.setSuccess('Logo updated successfully!');
          this.saving = false;
          this.selectedLogoImage = null;
          this.loadStoreDetails(); // Reload to get updated logo URL
        },
        error: (error) => {
          console.error('Error updating logo:', error);
          this.setError('Failed to update logo');
          this.saving = false;
        },
      });
  }

  async onSubmit() {
    if (!this.storeForm.valid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.storeForm.value;

    // Create FormData to send files as actual files
    const formData = new FormData();

    // Add all text fields
    formData.append('businessName', formValue.businessName);
    formData.append('description', formValue.description || '');
    formData.append('address', formValue.address || '');
    formData.append('city', formValue.city || '');
    formData.append('state', formValue.state || '');
    formData.append('pincode', formValue.pincode || '');
    formData.append('phone', formValue.phone || '');
    formData.append('website', formValue.website || '');
    formData.append('type', formValue.type || '');
    formData.append('openTime', formValue.openTime || '');
    formData.append('closeTime', formValue.closeTime || '');
    formData.append('supportDelivery', String(formValue.supportDelivery));
    formData.append('sameDayDelivery', String(formValue.sameDayDelivery));

    // Add location data as JSON string
    if (formValue.location) {
      formData.append('location', JSON.stringify(formValue.location));
    }

    // Add image files
    if (this.selectedCoverImage) {
      formData.append('coverImage', this.selectedCoverImage);
    }
    if (this.selectedLogoImage) {
      formData.append('logo', this.selectedLogoImage);
    }

    console.log('Submitting store data with FormData:', {
      businessName: formValue.businessName,
      hasCoverImage: !!this.selectedCoverImage,
      hasLogoImage: !!this.selectedLogoImage,
    });

    if (this.currentStore && this.currentStore._id) {
      // Update existing store
      this.storeService
        .updateStoreWithFormData(this.currentStore._id, formData)
        .subscribe({
          next: (response) => {
            this.setSuccess('Store settings updated successfully!');
            this.saving = false;
            // Clear selected images after successful save
            this.selectedCoverImage = null;
            this.selectedLogoImage = null;
            this.loadStoreDetails(); // Reload to get updated data
          },
          error: (error) => {
            console.error('Error updating store:', error);
            this.setError('Failed to update store settings');
            this.saving = false;
          },
        });
    } else {
      // Create new store
      this.storeService.createStoreWithFormData(formData).subscribe({
        next: (response) => {
          this.setSuccess('Store created successfully!');
          this.saving = false;
          // Clear selected images after successful save
          this.selectedCoverImage = null;
          this.selectedLogoImage = null;
          this.loadStoreDetails();
        },
        error: (error) => {
          console.error('Error creating store:', error);
          this.setError('Failed to create store');
          this.saving = false;
        },
      });
    }
  }

  getMerchantId(): string {
    const user = this.authService.getCurrentUser();
    return (user as any)?.id || (user as any)?._id || '';
  }

  setSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  setError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }
}
