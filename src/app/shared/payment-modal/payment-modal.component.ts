import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PaymentDetails {
  amount: number;
  paymentMethod: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  nameOnCard?: string;
  upiId?: string;
}

@Component({
  selector: 'app-payment-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div
      *ngIf="isVisible"
      class="modal-overlay"
      (click)="onOverlayClick($event)"
    >
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Featured Store Subscription</h3>
          <button class="close-btn" (click)="close()">&times;</button>
        </div>

        <div class="modal-body">
          <div class="subscription-info">
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

            <form class="payment-form" (ngSubmit)="processPayment()">
              <div class="form-group">
                <label>Payment Method</label>
                <select
                  [(ngModel)]="paymentDetails.paymentMethod"
                  name="paymentMethod"
                  required
                >
                  <option value="">Select Payment Method</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="netbanking">Net Banking</option>
                  <option value="wallet">Digital Wallet</option>
                </select>
              </div>

              <div
                *ngIf="paymentDetails.paymentMethod === 'card'"
                class="card-details"
              >
                <div class="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    [(ngModel)]="paymentDetails.cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxlength="19"
                    (input)="formatCardNumber($event)"
                  />
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      [(ngModel)]="paymentDetails.expiryDate"
                      name="expiryDate"
                      placeholder="MM/YY"
                      maxlength="5"
                      (input)="formatExpiryDate($event)"
                    />
                  </div>

                  <div class="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      [(ngModel)]="paymentDetails.cvv"
                      name="cvv"
                      placeholder="123"
                      maxlength="4"
                      (input)="formatCVV($event)"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>Name on Card</label>
                  <input
                    type="text"
                    [(ngModel)]="paymentDetails.nameOnCard"
                    name="nameOnCard"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div
                *ngIf="paymentDetails.paymentMethod === 'upi'"
                class="upi-details"
              >
                <div class="form-group">
                  <label>UPI ID</label>
                  <input
                    type="text"
                    [(ngModel)]="paymentDetails.upiId"
                    name="upiId"
                    placeholder="yourname@paytm"
                  />
                </div>
              </div>

              <div class="payment-summary">
                <div class="summary-row">
                  <span>Featured Store Subscription</span>
                  <span>₹250.00</span>
                </div>
                <div class="summary-row total">
                  <span>Total Amount</span>
                  <span>₹250.00</span>
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
            (click)="processPayment()"
            [disabled]="!isPaymentValid() || processing"
          >
            <span *ngIf="!processing">Pay ₹250</span>
            <span *ngIf="processing">Processing...</span>
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
        max-width: 500px;
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

      .subscription-info {
        .plan-card {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 2px solid #f59e0b;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
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

      .payment-form {
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
          select {
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
          }
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .card-details,
        .upi-details {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-top: 0.5rem;
        }
      }

      .payment-summary {
        background: #f3f4f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin-top: 1rem;

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;

          &.total {
            font-weight: 700;
            font-size: 1.1rem;
            color: #1f2937;
            border-top: 1px solid #d1d5db;
            padding-top: 0.5rem;
            margin-top: 0.5rem;
          }
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
    `,
  ],
})
export class PaymentModalComponent {
  @Input() isVisible = false;
  @Input() storeName = '';
  @Output() paymentProcessed = new EventEmitter<PaymentDetails>();
  @Output() closed = new EventEmitter<void>();

  processing = false;
  paymentDetails: PaymentDetails = {
    amount: 250,
    paymentMethod: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    upiId: '',
  };

  close() {
    this.closed.emit();
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  processPayment() {
    if (!this.isPaymentValid()) return;

    this.processing = true;

    // Simulate payment processing
    setTimeout(() => {
      this.paymentProcessed.emit(this.paymentDetails);
      this.processing = false;
    }, 2000);
  }

  isPaymentValid(): boolean {
    if (!this.paymentDetails.paymentMethod) return false;

    if (this.paymentDetails.paymentMethod === 'card') {
      return !!(
        this.paymentDetails.cardNumber &&
        this.paymentDetails.expiryDate &&
        this.paymentDetails.cvv &&
        this.paymentDetails.nameOnCard
      );
    }

    return true;
  }

  formatCardNumber(event: any) {
    let value = event.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    event.target.value = formattedValue;
    this.paymentDetails.cardNumber = formattedValue;
  }

  formatExpiryDate(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    event.target.value = value;
    this.paymentDetails.expiryDate = value;
  }

  formatCVV(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    event.target.value = value;
    this.paymentDetails.cvv = value;
  }
}
