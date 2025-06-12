import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../../../core/services/data.service';
import { Customer } from '../../../core/models';
import { CustomerModalComponent } from './customer-modal.component';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {
  private dataService = inject(DataService);
  private modalService = inject(NgbModal);
  
  customers$: Observable<Customer[]> = this.dataService.getCustomers();

  ngOnInit(): void {}

  openCreateModal(): void {
    const modalRef = this.modalService.open(CustomerModalComponent, { size: 'lg' });
    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          // Cliente guardado exitosamente
        }
      },
      () => {
        // Modal cerrado sin guardar
      }
    );
  }

  editCustomer(customer: Customer): void {
    const modalRef = this.modalService.open(CustomerModalComponent, { size: 'lg' });
    modalRef.componentInstance.customer = customer;
    
    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          // Cliente actualizado exitosamente
        }
      },
      () => {
        // Modal cerrado sin guardar
      }
    );
  }

  deleteCustomer(id: string): void {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      this.dataService.deleteCustomer(id);
    }
  }

  getCustomerInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatPhoneNumber(phone?: string): string {
    if (!phone) return '';
    // Simple phone formatting
    return phone.replace(/(\+\d{1})(\d{3})(\d{3})(\d{4})/, '$1 $2-$3-$4');
  }

  getLastPurchaseText(lastPurchaseDate?: Date): string {
    if (!lastPurchaseDate) return 'Sin compras';
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastPurchaseDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
    return `Hace ${Math.ceil(diffDays / 30)} meses`;
  }

  // TrackBy function for performance
  trackCustomer(_index: number, customer: Customer): string {
    return customer.id;
  }
}