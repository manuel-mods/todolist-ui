import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';
import { DataService } from '../../../core/services/data.service';
import { Sale } from '../../../core/models';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss']
})
export class SalesListComponent implements OnInit {
  private dataService = inject(DataService);
  
  // Filtros
  dateFilter = {
    from: '',
    to: ''
  };
  paymentFilter = '';
  
  // Subjects para filtros
  private filtersSubject = new BehaviorSubject<any>({
    dateFrom: '',
    dateTo: '',
    paymentMethod: ''
  });

  // Observable de ventas filtradas
  filteredSales$: Observable<Sale[]> = combineLatest([
    this.dataService.getSales(),
    this.filtersSubject.asObservable()
  ]).pipe(
    map(([sales, filters]) => this.filterSales(sales, filters))
  );

  // Estadísticas
  totalSales = 0;
  totalRevenue = 0;

  ngOnInit(): void {
    // Calcular estadísticas
    this.filteredSales$.subscribe(sales => {
      this.totalSales = sales.length;
      this.totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    });
  }

  private filterSales(sales: Sale[], filters: any): Sale[] {
    return sales.filter(sale => {
      // Filtro por fecha
      if (filters.dateFrom) {
        const saleDate = new Date(sale.date);
        const fromDate = new Date(filters.dateFrom);
        if (saleDate < fromDate) return false;
      }
      
      if (filters.dateTo) {
        const saleDate = new Date(sale.date);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Final del día
        if (saleDate > toDate) return false;
      }
      
      // Filtro por método de pago
      if (filters.paymentMethod && sale.paymentMethod !== filters.paymentMethod) {
        return false;
      }
      
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Más recientes primero
  }

  applyFilters(): void {
    this.filtersSubject.next({
      dateFrom: this.dateFilter.from,
      dateTo: this.dateFilter.to,
      paymentMethod: this.paymentFilter
    });
  }

  clearFilters(): void {
    this.dateFilter = { from: '', to: '' };
    this.paymentFilter = '';
    this.filtersSubject.next({
      dateFrom: '',
      dateTo: '',
      paymentMethod: ''
    });
  }

  getPaymentMethodClass(method: string): string {
    switch (method) {
      case 'efectivo': return 'bg-success';
      case 'tarjeta': return 'bg-primary';
      case 'transferencia': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getPaymentMethodBadgeClass(method: string): string {
    switch (method) {
      case 'efectivo': return 'badge-success';
      case 'tarjeta': return 'badge-primary';
      case 'transferencia': return 'badge-warning';
      default: return 'badge-primary';
    }
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'efectivo': return 'bi-cash';
      case 'tarjeta': return 'bi-credit-card';
      case 'transferencia': return 'bi-bank';
      default: return 'bi-question-circle';
    }
  }

  getPaymentMethodLabel(method: string): string {
    switch (method) {
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta';
      case 'transferencia': return 'Transferencia';
      default: return method;
    }
  }

  printReceipt(sale: Sale): void {
    // Generar contenido del recibo
    const receiptContent = this.generateReceiptContent(sale);
    
    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Imprimir automáticamente después de cargar
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  }

  private generateReceiptContent(sale: Sale): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo de Venta</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12px; 
            margin: 10px; 
            width: 250px;
          }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .sale-info { margin: 10px 0; }
          .items { border-bottom: 1px dashed #000; padding-bottom: 10px; }
          .item { display: flex; justify-content: space-between; margin: 2px 0; }
          .totals { margin-top: 10px; }
          .total-line { display: flex; justify-content: space-between; }
          .final-total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>🍰 PASTELERÍA</h2>
          <p>Recibo de Venta</p>
        </div>
        
        <div class="sale-info">
          <div>Venta #: ${sale.id}</div>
          <div>Fecha: ${new Date(sale.date).toLocaleString()}</div>
          ${sale.customerName ? `<div>Cliente: ${sale.customerName}</div>` : ''}
          <div>Pago: ${this.getPaymentMethodLabel(sale.paymentMethod)}</div>
        </div>
        
        <div class="items">
          <div style="border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
            <strong>PRODUCTOS</strong>
          </div>
          ${sale.items.map(item => `
            <div class="item">
              <span>${item.productName}</span>
            </div>
            <div class="item">
              <span>${item.quantity} x $${item.unitPrice.toFixed(2)}</span>
              <span>$${item.totalPrice.toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>$${sale.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-line">
            <span>IVA (18%):</span>
            <span>$${sale.tax.toFixed(2)}</span>
          </div>
          <div class="total-line final-total">
            <span>TOTAL:</span>
            <span>$${sale.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 10px;">
          ¡Gracias por su compra!<br>
          Vuelva pronto
        </div>
      </body>
      </html>
    `;
  }

  // TrackBy function for performance
  trackSale(_index: number, sale: Sale): string {
    return sale.id;
  }
}