import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from '../../../core/services/data.service';
import { Customer } from '../../../core/models';

@Component({
  selector: 'app-customer-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-modal.component.html',
  styleUrls: ['./customer-modal.component.scss']
})
export class CustomerModalComponent implements OnInit {
  @Input() customer?: Customer;

  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  protected activeModal = inject(NgbActiveModal);

  customerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.email]],
    phone: [''],
    address: [''],
    birthDate: [''],
    notes: ['']
  });

  isEditMode = false;

  ngOnInit(): void {
    this.isEditMode = !!this.customer;
    
    if (this.customer) {
      this.customerForm.patchValue({
        name: this.customer.name,
        email: this.customer.email || '',
        phone: this.customer.phone || '',
        address: this.customer.address || '',
        birthDate: this.customer.birthDate || '',
        notes: this.customer.notes || ''
      });
    }
  }

  get formControls() {
    return this.customerForm.controls;
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      const formValue = this.customerForm.value;
      
      if (this.isEditMode && this.customer) {
        // Update existing customer
        const updatedCustomer: Customer = {
          ...this.customer,
          ...formValue,
          updatedAt: new Date()
        };
        this.dataService.updateCustomer(updatedCustomer);
      } else {
        // Add new customer
        this.dataService.addCustomer(formValue);
      }
      
      this.activeModal.close('saved');
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.customerForm.controls).forEach(key => {
        this.customerForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.customerForm.get(controlName);
    return !!(control?.hasError(errorType) && control?.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.customerForm.get(controlName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldDisplayName(controlName)} es requerido`;
    }
    
    if (control?.hasError('email')) {
      return 'Ingresa un email válido';
    }
    
    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength'].requiredLength;
      return `${this.getFieldDisplayName(controlName)} debe tener al menos ${requiredLength} caracteres`;
    }
    
    return '';
  }

  private getFieldDisplayName(controlName: string): string {
    const fieldNames: { [key: string]: string } = {
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      address: 'Dirección',
      birthDate: 'Fecha de nacimiento',
      notes: 'Notas'
    };
    
    return fieldNames[controlName] || controlName;
  }
}