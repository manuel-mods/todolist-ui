import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ReportsService } from '../../core/services/reports.service';
import { SalesReport, CustomerReport, InventoryReport } from '../../core/models';
import { SalesReportComponent } from './components/sales-report.component';
import { CustomerReportComponent } from './components/customer-report.component';
import { InventoryReportComponent } from './components/inventory-report.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, SalesReportComponent, CustomerReportComponent, InventoryReportComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit {
  private reportsService = inject(ReportsService);
  
  salesReport$!: Observable<SalesReport>;
  customerReport$!: Observable<CustomerReport>;
  inventoryReport$!: Observable<InventoryReport>;
  
  activeTab: 'sales' | 'customers' | 'inventory' = 'sales';

  ngOnInit(): void {
    this.loadReports();
  }

  private loadReports(): void {
    this.salesReport$ = this.reportsService.getSalesReport('monthly');
    this.customerReport$ = this.reportsService.getCustomerReport();
    this.inventoryReport$ = this.reportsService.getInventoryReport();
  }

  switchTab(tab: 'sales' | 'customers' | 'inventory'): void {
    this.activeTab = tab;
  }

  refreshReports(): void {
    this.loadReports();
  }
}