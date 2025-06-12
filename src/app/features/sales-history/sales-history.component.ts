import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Sale } from '../../core/models';
import { SalesListComponent } from './components/sales-list.component';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [CommonModule, SalesListComponent],
  templateUrl: './sales-history.component.html',
  styleUrls: ['./sales-history.component.scss']
})
export class SalesHistoryComponent {
  private dataService = inject(DataService);
  
  sales$: Observable<Sale[]> = this.dataService.getSales();

  getTotalSales(sales: Sale[]): number {
    return sales.reduce((total, sale) => total + sale.total, 0);
  }
}