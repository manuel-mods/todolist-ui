import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {
  @Input() title: string = 'Confirmar';
  @Input() message: string = '';
  @Input() confirmText: string = 'Aceptar';
  @Input() cancelText: string = 'Cancelar';
  @Input() variant: 'primary' | 'danger' | 'warning' | 'success' = 'primary';
  @Input() loading: boolean = false;

  constructor(public activeModal: NgbActiveModal) {}

  confirm() {
    if (!this.loading) {
      this.activeModal.close(true);
    }
  }

  cancel() {
    if (!this.loading) {
      this.activeModal.dismiss(false);
    }
  }

  getButtonClass() {
    const variantMap = {
      'primary': 'btn-primary',
      'danger': 'btn-danger',
      'warning': 'btn-warning',
      'success': 'btn-success'
    };
    return variantMap[this.variant] || 'btn-primary';
  }
}