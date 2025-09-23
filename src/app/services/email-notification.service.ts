import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';

export interface EmailTemplate {
  to: string;
  subject: string;
  template: string;
  data: any;
}

@Injectable({
  providedIn: 'root',
})
export class EmailNotificationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Send approval request confirmation to merchant
  sendApprovalRequestConfirmation(
    merchantEmail: string,
    storeName: string,
    requestId: string
  ): Observable<any> {
    const template: EmailTemplate = {
      to: merchantEmail,
      subject: `Featured Store Request Submitted - ${storeName}`,
      template: 'approval-request-confirmation',
      data: {
        storeName,
        requestId,
        merchantEmail,
      },
    };
    return this.http.post(`${this.apiUrl}/api/email/send`, template);
  }

  // Send approval notification to admin
  sendApprovalRequestToAdmin(
    adminEmail: string,
    request: any
  ): Observable<any> {
    const template: EmailTemplate = {
      to: adminEmail,
      subject: `New Featured Store Request - ${request.storeName}`,
      template: 'approval-request-admin',
      data: {
        ...request,
        adminEmail,
      },
    };
    return this.http.post(`${this.apiUrl}/api/email/send`, template);
  }

  // Send approval notification to merchant
  sendApprovalNotification(
    merchantEmail: string,
    storeName: string,
    approved: boolean,
    adminNotes?: string
  ): Observable<any> {
    const template: EmailTemplate = {
      to: merchantEmail,
      subject: `Featured Store Request ${
        approved ? 'Approved' : 'Rejected'
      } - ${storeName}`,
      template: approved ? 'approval-approved' : 'approval-rejected',
      data: {
        storeName,
        approved,
        adminNotes,
        merchantEmail,
      },
    };
    return this.http.post(`${this.apiUrl}/api/email/send`, template);
  }

  // Send payment reminder
  sendPaymentReminder(
    merchantEmail: string,
    storeName: string,
    amount: number,
    dueDate: string
  ): Observable<any> {
    const template: EmailTemplate = {
      to: merchantEmail,
      subject: `Payment Reminder - Featured Store Subscription - ${storeName}`,
      template: 'payment-reminder',
      data: {
        storeName,
        amount,
        dueDate,
        merchantEmail,
      },
    };
    return this.http.post(`${this.apiUrl}/api/email/send`, template);
  }

  // Send featured store expiry warning
  sendExpiryWarning(
    merchantEmail: string,
    storeName: string,
    expiryDate: string
  ): Observable<any> {
    const template: EmailTemplate = {
      to: merchantEmail,
      subject: `Featured Store Expiring Soon - ${storeName}`,
      template: 'expiry-warning',
      data: {
        storeName,
        expiryDate,
        merchantEmail,
      },
    };
    return this.http.post(`${this.apiUrl}/api/email/send`, template);
  }
}
