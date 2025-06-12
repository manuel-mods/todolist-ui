import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { Customer } from '../../core/models';
import { CustomerListComponent } from './components/customer-list.component';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, CustomerListComponent],
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.scss']
})
export class CustomersComponent {
  private dataService = inject(DataService);
  
  customers$: Observable<Customer[]> = this.dataService.getCustomers();

  getCustomerStats() {
    return this.dataService.getCustomerStats();
  }
}