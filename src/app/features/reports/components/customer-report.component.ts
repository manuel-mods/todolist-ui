import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerReport } from '../../../core/models';

@Component({
  selector: 'app-customer-report',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-report.component.html',
  styleUrls: ['./customer-report.component.scss']
})
export class CustomerReportComponent {
  @Input() report!: CustomerReport;

  getRankClass(index: number): string {
    switch (index) {
      case 0: return 'rank-gold';
      case 1: return 'rank-silver';
      case 2: return 'rank-bronze';
      default: return 'rank-default';
    }
  }

  getMaxNewCustomers(): number {
    return Math.max(...this.report.customerGrowthData.map(data => data.newCustomers));
  }

  getMaxTotalCustomers(): number {
    return Math.max(...this.report.customerGrowthData.map(data => data.totalCustomers));
  }

  getBarHeight(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }
}