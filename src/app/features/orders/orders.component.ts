import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
  standalone: true,
  imports: [CommonModule, PaginationComponent],
})
export class OrdersComponent {
  orders: any[] = [];
  paginatedOrders: any[] = [];
  searchTerm = '';

  currentPage = 1;
  itemsPerPage = 10;

  constructor(private http: HttpClient) {}
  ngOnInit() {
    this.getOrders();
  }
  getOrders() {
    this.http.get<any[]>(`${environment.apiUrl}/order/`).subscribe({
      next: (data) => {
        this.orders = data;
        this.updatePagination();
      },
      error: (err) => console.error('Error fetching orders:', err),
    });
  }

  searchOrders() {
    const term = this.searchTerm.trim();
    if (!term) {
      this.getOrders();
      return;
    }

    this.http
      .get<any[]>(`${environment.apiUrl}/order/search`, {
        params: { query: term },
      })
      .subscribe({
        next: (data) => {
          this.orders = data;
          this.updatePagination();
        },
        error: (err) => console.error('Error searching orders:', err),
      });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedOrders = this.orders.slice(start, end);
  }
}
