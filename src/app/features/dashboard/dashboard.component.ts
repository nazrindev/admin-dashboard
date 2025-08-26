import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartType, Chart, registerables } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';
import { AuthService, User } from '../../services/auth.service';
import { Router } from '@angular/router';

interface DashboardSummary {
  revenue: number;
  orders: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  stores: number;
  activeProducts: number;
}

interface DashboardOrderItem {
  product: string;
  quantity: number;
  price: number;
  name: string;
  tax: number;
  _id: string;
}

interface DashboardOrder {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  customer?: {
    _id: string;
    name: string;
    email: string;
  };
  items: DashboardOrderItem[];
}

interface DashboardResponse {
  summary: DashboardSummary;
  recentOrders: DashboardOrder[];
  topProducts: any[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgChartsModule],
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    Chart.register(...registerables);
    this.loadDashboard();
  }

  public isLoading = false;
  public errorMessage: string | null = null;
  public summary: DashboardSummary | null = null;
  public recentOrders: DashboardOrder[] = [];

  // Actions
  public onViewAll(): void {
    this.router.navigate(['/orders']);
  }

  public onViewOrder(order: DashboardOrder): void {
    this.router.navigate(['/orders'], {
      queryParams: { orderId: order._id || order.orderNumber },
    });
  }

  public onExport(): void {
    const rows =
      this.recentOrders && this.recentOrders.length ? this.recentOrders : [];
    const header = [
      'Order Number',
      'Customer Name',
      'Date',
      'Total',
      'Status',
      'Payment Status',
    ];
    const csvLines = [header.join(',')];
    for (const o of rows) {
      const line = [
        o.orderNumber,
        o.customer?.name || 'Guest',
        new Date(o.createdAt).toISOString(),
        String(o.total),
        o.status,
        (o as any).paymentStatus || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
      csvLines.push(line);
    }
    const blob = new Blob([csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recent-orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  public onAddProduct(): void {
    this.router.navigate(['/products'], { queryParams: { action: 'add' } });
  }

  public onManageInventory(): void {
    this.router.navigate(['/products'], { queryParams: { tab: 'inventory' } });
  }

  public onViewReports(): void {
    this.router.navigate(['/dashboard'], { queryParams: { view: 'reports' } });
  }

  public onSendNewsletter(): void {
    this.router.navigate(['/customers'], {
      queryParams: { action: 'newsletter' },
    });
  }

  public onOpenSettings(): void {
    this.router.navigate(['/settings']);
  }

  public onOpenHelp(): void {
    window.open('https://example.com/help', '_blank');
  }

  private getMerchantId(): string | null {
    const user: User | (User & { _id?: string }) | null =
      this.authService.getCurrentUser() as any;
    const maybeId = (user as any)?._id || (user as any)?.id;
    return maybeId ?? null;
  }

  public refresh(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    const merchantId = this.getMerchantId();
    if (!merchantId) {
      this.errorMessage = 'No merchant is logged in.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.http
      .get<DashboardResponse>(
        `${environment.apiUrl}/api/merchant/${merchantId}/dashboard`
      )
      .subscribe({
        next: (res) => {
          this.summary = res.summary;
          this.recentOrders = res.recentOrders ?? [];
          this.updateChartFromOrders(this.recentOrders);
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage =
            err?.error?.message || 'Failed to load dashboard.';
          this.isLoading = false;
        },
      });
  }

  private updateChartFromOrders(orders: DashboardOrder[]): void {
    // Build last 12 months labels ending current month
    const now = new Date();
    const monthLabels: string[] = [];
    const monthKeys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      monthKeys.push(key);
      monthLabels.push(d.toLocaleString(undefined, { month: 'long' }));
    }

    const totalsByMonth: Record<string, number> = Object.fromEntries(
      monthKeys.map((k) => [k, 0])
    ) as Record<string, number>;

    for (const o of orders) {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      if (key in totalsByMonth) {
        totalsByMonth[key] += Number(o.total) || 0;
      }
    }

    const data = monthKeys.map((k) => totalsByMonth[k]);

    this.barChartData = {
      labels: monthLabels,
      datasets: [
        {
          data,
          label: 'Monthly Sales ($)',
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#06b6d4',
            '#84cc16',
            '#f97316',
            '#ec4899',
            '#6366f1',
            '#14b8a6',
            '#fbbf24',
          ],
          borderColor: [
            '#2563eb',
            '#059669',
            '#d97706',
            '#dc2626',
            '#7c3aed',
            '#0891b2',
            '#65a30d',
            '#ea580c',
            '#db2777',
            '#4f46e5',
            '#0d9488',
            '#f59e0b',
          ],
          borderWidth: 1,
        },
      ],
    };
  }

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  public barType = 'bar' as const;

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    datasets: [
      {
        data: [
          12500, 18900, 15600, 22100, 19800, 24500, 28900, 31200, 27600, 33400,
          29800, 45230,
        ],
        label: 'Monthly Sales ($)',
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#ec4899',
          '#6366f1',
          '#14b8a6',
          '#fbbf24',
        ],
        borderColor: [
          '#2563eb',
          '#059669',
          '#d97706',
          '#dc2626',
          '#7c3aed',
          '#0891b2',
          '#65a30d',
          '#ea580c',
          '#db2777',
          '#4f46e5',
          '#0d9488',
          '#f59e0b',
        ],
        borderWidth: 1,
      },
    ],
  };
}
