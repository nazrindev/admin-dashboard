import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

export interface ApprovalRequest {
  storeId: string;
  storeName: string;
  businessType: string;
  reasonForFeaturing: string;
  expectedBenefits: string;
  contactEmail: string;
  contactPhone: string;
  businessDescription: string;
  monthlyBudget: number;
  preferredStartDate: string;
  additionalNotes?: string;
}

@Component({
  selector: 'app-approval-request-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div
      *ngIf="isVisible"
      class="modal-overlay"
      (click)="onOverlayClick($event)"
    >
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Featured Store Request</h3>
          <button class="close-btn" (click)="close()">&times;</button>
        </div>

        <div class="modal-body">
          <div class="request-info">
            <div class="plan-card">
              <h4>Featured Store Plan</h4>
              <div class="price">₹250<span class="period">/month</span></div>
              <ul class="features">
                <li>✨ Featured placement in search results</li>
                <li>🎯 Priority visibility to customers</li>
                <li>📈 Enhanced analytics</li>
                <li>🏷️ Featured badge on store</li>
                <li>📱 Mobile app promotion</li>
              </ul>
            </div>

            <form [formGroup]="approvalForm" (ngSubmit)="submitRequest()">
              <div class="form-section">
                <h4>Business Information</h4>

                <div class="form-group">
                  <label>Business Type *</label>
                  <select formControlName="businessType" required>
                    <option value="">Select Business Type</option>
                    <option value="retail">Retail Store</option>
                    <option value="restaurant">Restaurant/Food</option>
                    <option value="fashion">Fashion & Apparel</option>
                    <option value="electronics">Electronics</option>
                    <option value="beauty">Beauty & Wellness</option>
                    <option value="home">Home & Garden</option>
                    <option value="automotive">Automotive</option>
                    <option value="services">Services</option>
                    <option value="other">Other</option>
                  </select>
                  <div
                    *ngIf="
                      approvalForm.get('businessType')?.invalid &&
                      approvalForm.get('businessType')?.touched
                    "
                    class="error-message"
                  >
                    Please select a business type
                  </div>
                </div>

                <div class="form-group">
                  <label>Business Description *</label>
                  <textarea
                    formControlName="businessDescription"
                    placeholder="Describe your business, products, and services..."
                    rows="3"
                    required
                  >
                  </textarea>
                  <div
                    *ngIf="
                      approvalForm.get('businessDescription')?.invalid &&
                      approvalForm.get('businessDescription')?.touched
                    "
                    class="error-message"
                  >
                    Please provide a business description
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Contact Email *</label>
                    <input
                      type="email"
                      formControlName="contactEmail"
                      placeholder="your@email.com"
                      required
                    />
                    <div
                      *ngIf="
                        approvalForm.get('contactEmail')?.invalid &&
                        approvalForm.get('contactEmail')?.touched
                      "
                      class="error-message"
                    >
                      Please enter a valid email
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Contact Phone *</label>
                    <input
                      type="tel"
                      formControlName="contactPhone"
                      placeholder="+91 98765 43210"
                      required
                    />
                    <div
                      *ngIf="
                        approvalForm.get('contactPhone')?.invalid &&
                        approvalForm.get('contactPhone')?.touched
                      "
                      class="error-message"
                    >
                      Please enter a valid phone number
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h4>Featured Store Request Details</h4>

                <div class="form-group">
                  <label>Why do you want to feature your store? *</label>
                  <textarea
                    formControlName="reasonForFeaturing"
                    placeholder="Explain why featuring your store would benefit your business..."
                    rows="3"
                    required
                  >
                  </textarea>
                  <div
                    *ngIf="
                      approvalForm.get('reasonForFeaturing')?.invalid &&
                      approvalForm.get('reasonForFeaturing')?.touched
                    "
                    class="error-message"
                  >
                    Please explain your reason for featuring
                  </div>
                </div>

                <div class="form-group">
                  <label>What benefits do you expect? *</label>
                  <textarea
                    formControlName="expectedBenefits"
                    placeholder="What specific benefits do you expect from featuring your store?"
                    rows="3"
                    required
                  >
                  </textarea>
                  <div
                    *ngIf="
                      approvalForm.get('expectedBenefits')?.invalid &&
                      approvalForm.get('expectedBenefits')?.touched
                    "
                    class="error-message"
                  >
                    Please describe expected benefits
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Monthly Budget *</label>
                    <select formControlName="monthlyBudget" required>
                      <option value="">Select Budget</option>
                      <option value="250">₹250 - Basic Featured</option>
                      <option value="500">₹500 - Premium Featured</option>
                      <option value="1000">₹1000+ - Enterprise Featured</option>
                    </select>
                    <div
                      *ngIf="
                        approvalForm.get('monthlyBudget')?.invalid &&
                        approvalForm.get('monthlyBudget')?.touched
                      "
                      class="error-message"
                    >
                      Please select your budget
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Preferred Start Date *</label>
                    <input
                      type="date"
                      formControlName="preferredStartDate"
                      [min]="today"
                      required
                    />
                    <div
                      *ngIf="
                        approvalForm.get('preferredStartDate')?.invalid &&
                        approvalForm.get('preferredStartDate')?.touched
                      "
                      class="error-message"
                    >
                      Please select a start date
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label>Additional Notes</label>
                  <textarea
                    formControlName="additionalNotes"
                    placeholder="Any additional information you'd like to share..."
                    rows="2"
                  >
                  </textarea>
                </div>
              </div>

              <div class="request-summary">
                <div class="summary-row">
                  <span>Featured Store Subscription</span>
                  <span
                    >₹{{
                      approvalForm.get('monthlyBudget')?.value || 250
                    }}/month</span
                  >
                </div>
                <div class="summary-note">
                  <small
                    >Your request will be reviewed within 24-48 hours. You'll
                    receive an email confirmation once approved.</small
                  >
                </div>
              </div>
            </form>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="close()">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-primary"
            (click)="submitRequest()"
            [disabled]="!approvalForm.valid || processing"
          >
            <span *ngIf="!processing">Submit Request</span>
            <span *ngIf="processing">Submitting...</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
      }

      .modal-content {
        background: white;
        border-radius: 1rem;
        max-width: 700px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #e5e7eb;

        h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 700;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem;

          &:hover {
            color: #374151;
          }
        }
      }

      .modal-body {
        padding: 1.5rem;
      }

      .request-info {
        .plan-card {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: center;

          h4 {
            margin: 0 0 0.5rem 0;
            color: #92400e;
            font-size: 1.25rem;
            font-weight: 700;
          }

          .price {
            font-size: 2rem;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 1rem;

            .period {
              font-size: 1rem;
              font-weight: 500;
              color: #a16207;
            }
          }

          .features {
            list-style: none;
            padding: 0;
            margin: 0;
            text-align: left;

            li {
              padding: 0.25rem 0;
              color: #92400e;
              font-size: 0.9rem;
            }
          }
        }
      }

      .form-section {
        margin-bottom: 2rem;

        h4 {
          color: #374151;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e5e7eb;
        }
      }

      .form-group {
        margin-bottom: 1rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        input,
        select,
        textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 0.9rem;
          transition: border-color 0.2s;

          &:focus {
            outline: none;
            border-color: #3b82f6;
          }

          &.ng-invalid.ng-touched {
            border-color: #ef4444;
          }
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .request-summary {
        background: #f3f4f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-top: 1rem;

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-weight: 600;
          font-size: 1.1rem;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .summary-note {
          color: #6b7280;
          font-size: 0.9rem;
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid #e5e7eb;

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;

          &.btn-secondary {
            background: #f3f4f6;
            color: #374151;

            &:hover {
              background: #e5e7eb;
            }
          }

          &.btn-primary {
            background: #3b82f6;
            color: white;

            &:hover:not(:disabled) {
              background: #2563eb;
            }

            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ApprovalRequestModalComponent {
  @Input() isVisible = false;
  @Input() storeName = '';
  @Output() requestSubmitted = new EventEmitter<ApprovalRequest>();
  @Output() closed = new EventEmitter<void>();

  processing = false;
  approvalForm: FormGroup;
  today = new Date().toISOString().split('T')[0];

  constructor(private fb: FormBuilder) {
    this.approvalForm = this.fb.group({
      businessType: ['', Validators.required],
      businessDescription: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', Validators.required],
      reasonForFeaturing: ['', Validators.required],
      expectedBenefits: ['', Validators.required],
      monthlyBudget: ['250', Validators.required],
      preferredStartDate: ['', Validators.required],
      additionalNotes: [''],
    });
  }

  close() {
    this.closed.emit();
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  submitRequest() {
    if (!this.approvalForm.valid) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    this.processing = true;

    const request: ApprovalRequest = {
      storeId: '', // Will be set by parent component
      storeName: this.storeName,
      businessType: this.approvalForm.value.businessType,
      reasonForFeaturing: this.approvalForm.value.reasonForFeaturing,
      expectedBenefits: this.approvalForm.value.expectedBenefits,
      contactEmail: this.approvalForm.value.contactEmail,
      contactPhone: this.approvalForm.value.contactPhone,
      businessDescription: this.approvalForm.value.businessDescription,
      monthlyBudget: this.approvalForm.value.monthlyBudget,
      preferredStartDate: this.approvalForm.value.preferredStartDate,
      additionalNotes: this.approvalForm.value.additionalNotes,
    };

    // Simulate request submission
    setTimeout(() => {
      this.requestSubmitted.emit(request);
      this.processing = false;
    }, 1500);
  }
}
