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

  // Convert file to data URL like in products component
  private convertFileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  async onSubmit() {
    if (!this.storeForm.valid) {
      this.storeForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formValue = this.storeForm.value;

    // Prepare store data
    const storeData: any = {
      businessName: formValue.businessName,
      description: formValue.description,
      address: formValue.address,
      phone: formValue.phone,
      website: formValue.website,
      type: formValue.type,
      openTime: formValue.openTime,
      closeTime: formValue.closeTime,
      supportDelivery: formValue.supportDelivery,
      sameDayDelivery: formValue.sameDayDelivery,
      location: formValue.location,
    };

    // Handle image uploads - convert to data URLs like in products component
    try {
      if (this.selectedCoverImage) {
        storeData.coverImage = await this.convertFileToDataUrl(
          this.selectedCoverImage
        );
      } else if (this.currentStore?.coverImage) {
        storeData.coverImage = this.currentStore.coverImage;
      }

      if (this.selectedLogoImage) {
        storeData.logo = await this.convertFileToDataUrl(
          this.selectedLogoImage
        );
      } else if (this.currentStore?.logo) {
        storeData.logo = this.currentStore.logo;
      }
    } catch (error) {
      console.error('Error processing images:', error);
      this.setError('Error processing images');
      this.saving = false;
      return;
    }

    console.log(storeData);
    if (this.currentStore && this.currentStore._id) {
      // Update existing store
      this.storeService
        .updateStore(this.currentStore._id, storeData)
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
      this.storeService.createStore(storeData).subscribe({
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
