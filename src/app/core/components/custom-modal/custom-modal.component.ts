import { Component, Input, EventEmitter, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-custom-modal',
  templateUrl: './custom-modal.component.html',
  styleUrls: ['./custom-modal.component.scss'],
})
export class CustomModalComponent {
  @Input() title!: string;
  @Input() message!: string;
  @Input() icon!: string;
  @Output() confirm: EventEmitter<void> = new EventEmitter<void>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();
  constructor(public activeModal: NgbActiveModal) {}

  loading = false;
  setLoading(status: boolean) {
    this.loading = status;
  }

  dismiss() {
    this.activeModal.dismiss();
  }

  onConfirm() {
    this.confirm.emit();
    this.setLoading(true);
  }
  onCancel() {
    this.cancel.emit();
    // this.dismiss();
  }
}
