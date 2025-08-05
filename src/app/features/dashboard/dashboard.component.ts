import { Component, OnInit } from '@angular/core';
import { ChartConfiguration, ChartType, Chart, registerables } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: true,
  imports: [CommonModule, NgChartsModule]
})
export class DashboardComponent implements OnInit {
  ngOnInit() {
    Chart.register(...registerables);
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
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  public barType = 'bar' as const;

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    datasets: [
      {
        data: [12500, 18900, 15600, 22100, 19800, 24500, 28900, 31200, 27600, 33400, 29800, 45230],
        label: 'Monthly Sales ($)',
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#fbbf24'
        ],
        borderColor: [
          '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#ea580c', '#db2777', '#4f46e5', '#0d9488', '#f59e0b'
        ],
        borderWidth: 1
      }
    ]
  };
} 