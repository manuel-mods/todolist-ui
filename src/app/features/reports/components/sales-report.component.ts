import { Component, Input, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';
import { SalesReport } from '../../../core/models';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.scss']
})
export class SalesReportComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() report!: SalesReport;
  
  @ViewChild('salesChartCanvas', { static: false }) salesChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productChartCanvas', { static: false }) productChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChartCanvas', { static: false }) paymentChartCanvas!: ElementRef<HTMLCanvasElement>;

  private salesChart!: Chart;
  private productChart!: Chart;
  private paymentChart!: Chart;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.createCharts();
  }

  ngOnDestroy(): void {
    if (this.salesChart) this.salesChart.destroy();
    if (this.productChart) this.productChart.destroy();
    if (this.paymentChart) this.paymentChart.destroy();
  }

  private createCharts(): void {
    this.createSalesChart();
    this.createProductChart();
    this.createPaymentChart();
  }

  private createSalesChart(): void {
    const ctx = this.salesChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.report.dailySalesData.map(data => 
          new Date(data.date).toLocaleDateString('es', { month: 'short', day: 'numeric' })
        ),
        datasets: [
          {
            label: 'Ventas',
            data: this.report.dailySalesData.map(data => data.totalSales),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Ingresos ($)',
            data: this.report.dailySalesData.map(data => data.totalRevenue),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Número de Ventas'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Ingresos ($)'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        },
        plugins: {
          legend: {
            position: 'top'
          },
          title: {
            display: true,
            text: 'Tendencia de Ventas Diarias'
          }
        }
      }
    };

    this.salesChart = new Chart(ctx, config);
  }

  private createProductChart(): void {
    const ctx = this.productChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const topProducts = this.report.salesByProduct.slice(0, 5);
    
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: topProducts.map(product => product.productName),
        datasets: [{
          data: topProducts.map(product => product.totalRevenue),
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Productos Más Vendidos (por Ingresos)'
          }
        }
      }
    };

    this.productChart = new Chart(ctx, config);
  }

  private createPaymentChart(): void {
    const ctx = this.paymentChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.report.salesByPaymentMethod.map(method => this.getPaymentMethodLabel(method.method)),
        datasets: [{
          label: 'Número de Transacciones',
          data: this.report.salesByPaymentMethod.map(method => method.count),
          backgroundColor: [
            '#10B981',
            '#3B82F6',
            '#F59E0B'
          ],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Número de Transacciones'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Métodos de Pago Utilizados'
          }
        }
      }
    };

    this.paymentChart = new Chart(ctx, config);
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'transferencia': return 'Transferencia';
      default: return method;
    }
  }

  getPeriodLabel(): string {
    switch (this.report.period) {
      case 'daily': return 'Hoy';
      case 'weekly': return 'Esta Semana';
      case 'monthly': return 'Este Mes';
      case 'yearly': return 'Este Año';
      default: return 'Período Actual';
    }
  }

  getPaymentIcon(method: string): string {
    switch (method) {
      case 'efectivo': return 'bi-cash';
      case 'tarjeta': return 'bi-credit-card';
      case 'transferencia': return 'bi-bank';
      default: return 'bi-question-circle';
    }
  }
}