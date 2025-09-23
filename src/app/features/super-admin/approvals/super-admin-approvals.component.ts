import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StoreService } from '../../../services/store.service';

export interface ApprovalRequest {
  _id: string;
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
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
}

@Component({
  selector: 'app-super-admin-approvals',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="approvals-container">
      <!-- Success/Error Messages -->
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <!-- Header -->
      <div class="page-header">
        <h2>Featured Store Approvals</h2>
        <p class="page-description">
          Review and approve featured store requests from merchants
        </p>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid">
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <h3>{{ pendingCount }}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
        <div class="stat-card approved">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <h3>{{ approvedCount }}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div class="stat-card rejected">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <h3>{{ rejectedCount }}</h3>
            <p>Rejected</p>
          </div>
        </div>
        <div class="stat-card total">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <h3>{{ totalCount }}</h3>
            <p>Total Requests</p>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'pending'"
          (click)="setActiveTab('pending')"
        >
          Pending ({{ pendingCount }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'approved'"
          (click)="setActiveTab('approved')"
        >
          Approved ({{ approvedCount }})
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'rejected'"
          (click)="setActiveTab('rejected')"
        >
          Rejected ({{ rejectedCount }})
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading approval requests...</p>
      </div>

      <!-- Approval Requests List -->
      <div *ngIf="!loading" class="approvals-list">
        <div
          *ngFor="let request of filteredRequests"
          class="approval-card"
          [class.pending]="request.status === 'pending'"
        >
          <!-- Request Header -->
          <div class="request-header">
            <div class="store-info">
              <h3>{{ request.storeName }}</h3>
              <p class="business-type">
                {{ getBusinessTypeLabel(request.businessType) }}
              </p>
              <div class="request-meta">
                <span class="submitted-date"
                  >Submitted: {{ formatDate(request.submittedAt) }}</span
                >
                <span class="budget"
                  >Budget: ₹{{ request.monthlyBudget }}/month</span
                >
              </div>
            </div>
            <div class="request-status">
              <span class="status-badge" [class]="'status-' + request.status">
                {{ request.status.toUpperCase() }}
              </span>
            </div>
          </div>

          <!-- Request Details -->
          <div class="request-details">
            <div class="detail-section">
              <h4>Business Information</h4>
              <p>
                <strong>Description:</strong> {{ request.businessDescription }}
              </p>
              <p>
                <strong>Contact:</strong> {{ request.contactEmail }} |
                {{ request.contactPhone }}
              </p>
              <p>
                <strong>Preferred Start:</strong>
                {{ formatDate(request.preferredStartDate) }}
              </p>
            </div>

            <div class="detail-section">
              <h4>Featured Store Request</h4>
              <p><strong>Reason:</strong> {{ request.reasonForFeaturing }}</p>
              <p>
                <strong>Expected Benefits:</strong>
                {{ request.expectedBenefits }}
              </p>
              <p *ngIf="request.additionalNotes">
                <strong>Additional Notes:</strong> {{ request.additionalNotes }}
              </p>
            </div>

            <div *ngIf="request.status !== 'pending'" class="detail-section">
              <h4>Review Details</h4>
              <p>
                <strong>Reviewed:</strong> {{ formatDate(request.reviewedAt) }}
              </p>
              <p *ngIf="request.reviewedBy">
                <strong>Reviewed By:</strong> {{ request.reviewedBy }}
              </p>
              <p *ngIf="request.adminNotes">
                <strong>Admin Notes:</strong> {{ request.adminNotes }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div *ngIf="request.status === 'pending'" class="request-actions">
            <button
              class="btn btn-success"
              (click)="approveRequest(request)"
              [disabled]="processing"
            >
              Approve
            </button>
            <button
              class="btn btn-danger"
              (click)="rejectRequest(request)"
              [disabled]="processing"
            >
              Reject
            </button>
            <button class="btn btn-secondary" (click)="viewDetails(request)">
              View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="!loading && filteredRequests.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">📋</div>
        <h3>No {{ activeTab }} requests</h3>
        <p>
          There are no {{ activeTab }} featured store requests at the moment.
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .approvals-container {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 2rem;

        h2 {
          color: #1f2937;
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        .page-description {
          color: #6b7280;
          font-size: 1.2rem;
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: white;
        padding: 1.5rem;
        border-radius: 1rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform 0.2s ease;

        &:hover {
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-content {
          h3 {
            font-size: 2rem;
            font-weight: 700;
            margin: 0;
            color: #1f2937;
          }

          p {
            margin: 0;
            color: #6b7280;
            font-size: 0.9rem;
          }
        }

        &.pending {
          border-left: 4px solid #f59e0b;
        }

        &.approved {
          border-left: 4px solid #10b981;
        }

        &.rejected {
          border-left: 4px solid #ef4444;
        }

        &.total {
          border-left: 4px solid #3b82f6;
        }
      }

      .alert {
        padding: 1rem;
        border-radius: 0.5rem;
        margin-bottom: 1.5rem;
        font-weight: 500;

        &.alert-success {
          background-color: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        &.alert-error {
          background-color: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }
      }

      .filter-tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 2rem;
        border-bottom: 2px solid #e5e7eb;

        .tab-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          color: #6b7280;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;

          &:hover {
            color: #374151;
          }

          &.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
          }
        }
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        p {
          color: #6b7280;
          font-size: 1.1rem;
        }
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      .approvals-list {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .approval-card {
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 1rem;
        padding: 2rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        &.pending {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        }
      }

      .request-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;

        .store-info {
          h3 {
            margin: 0 0 0.5rem 0;
            color: #1f2937;
            font-size: 1.5rem;
            font-weight: 700;
          }

          .business-type {
            color: #6b7280;
            font-size: 1rem;
            margin-bottom: 1rem;
          }

          .request-meta {
            display: flex;
            gap: 2rem;
            font-size: 0.9rem;
            color: #6b7280;
          }
        }

        .request-status {
          .status-badge {
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;

            &.status-pending {
              background-color: #fef3c7;
              color: #92400e;
            }

            &.status-approved {
              background-color: #d1fae5;
              color: #065f46;
            }

            &.status-rejected {
              background-color: #fee2e2;
              color: #991b1b;
            }
          }
        }
      }

      .request-details {
        margin-bottom: 2rem;

        .detail-section {
          margin-bottom: 1.5rem;

          h4 {
            color: #374151;
            font-size: 1.1rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e5e7eb;
          }

          p {
            color: #6b7280;
            font-size: 1rem;
            margin-bottom: 0.75rem;
            line-height: 1.6;

            strong {
              color: #374151;
            }
          }
        }
      }

      .request-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;

        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 1rem;

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          &.btn-success {
            background: #10b981;
            color: white;

            &:hover:not(:disabled) {
              background: #059669;
              transform: translateY(-1px);
            }
          }

          &.btn-danger {
            background: #ef4444;
            color: white;

            &:hover:not(:disabled) {
              background: #dc2626;
              transform: translateY(-1px);
            }
          }

          &.btn-secondary {
            background: #f3f4f6;
            color: #374151;

            &:hover:not(:disabled) {
              background: #e5e7eb;
              transform: translateY(-1px);
            }
          }
        }
      }

      .empty-state {
        text-align: center;
        padding: 4rem 2rem;

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        h3 {
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }

        p {
          color: #6b7280;
          font-size: 1.1rem;
        }
      }

      @media (max-width: 768px) {
        .approvals-container {
          padding: 1rem;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }

        .request-header {
          flex-direction: column;
          gap: 1rem;
        }

        .request-actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class SuperAdminApprovalsComponent implements OnInit {
  requests: ApprovalRequest[] = [];
  filteredRequests: ApprovalRequest[] = [];
  loading = false;
  processing = false;
  successMessage = '';
  errorMessage = '';
  activeTab: 'pending' | 'approved' | 'rejected' = 'pending';

  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;
  totalCount = 0;

  constructor(private storeService: StoreService) {}

  ngOnInit() {
    this.loadApprovalRequests();
  }

  loadApprovalRequests() {
    this.loading = true;

    // Simulate API call to get approval requests
    this.storeService.getApprovalRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.updateCounts();
        this.filterRequests();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading approval requests:', error);
        this.setError('Failed to load approval requests');
        this.loading = false;
      },
    });
  }

  setActiveTab(tab: 'pending' | 'approved' | 'rejected') {
    this.activeTab = tab;
    this.filterRequests();
  }

  filterRequests() {
    this.filteredRequests = this.requests.filter(
      (req) => req.status === this.activeTab
    );
  }

  updateCounts() {
    this.pendingCount = this.requests.filter(
      (req) => req.status === 'pending'
    ).length;
    this.approvedCount = this.requests.filter(
      (req) => req.status === 'approved'
    ).length;
    this.rejectedCount = this.requests.filter(
      (req) => req.status === 'rejected'
    ).length;
    this.totalCount = this.requests.length;
  }

  approveRequest(request: ApprovalRequest) {
    if (
      confirm('Are you sure you want to approve this featured store request?')
    ) {
      this.processing = true;

      this.storeService.approveRequest(request._id, 'approved').subscribe({
        next: (response) => {
          request.status = 'approved';
          request.reviewedAt = new Date().toISOString();
          request.reviewedBy = 'Super Admin';
          this.updateCounts();
          this.filterRequests();
          this.setSuccess('Request approved successfully!');
          this.processing = false;
        },
        error: (error) => {
          console.error('Error approving request:', error);
          this.setError('Failed to approve request');
          this.processing = false;
        },
      });
    }
  }

  rejectRequest(request: ApprovalRequest) {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
      this.processing = true;

      this.storeService
        .approveRequest(request._id, 'rejected', reason)
        .subscribe({
          next: (response) => {
            request.status = 'rejected';
            request.reviewedAt = new Date().toISOString();
            request.reviewedBy = 'Super Admin';
            request.adminNotes = reason;
            this.updateCounts();
            this.filterRequests();
            this.setSuccess('Request rejected successfully!');
            this.processing = false;
          },
          error: (error) => {
            console.error('Error rejecting request:', error);
            this.setError('Failed to reject request');
            this.processing = false;
          },
        });
    }
  }

  viewDetails(request: ApprovalRequest) {
    // Open detailed view modal or navigate to details page
    console.log('View details for request:', request);
  }

  getBusinessTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      retail: 'Retail Store',
      restaurant: 'Restaurant/Food',
      fashion: 'Fashion & Apparel',
      electronics: 'Electronics',
      beauty: 'Beauty & Wellness',
      home: 'Home & Garden',
      automotive: 'Automotive',
      services: 'Services',
      other: 'Other',
    };
    return labels[type] || type;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
