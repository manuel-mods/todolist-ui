import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmModalComponent } from '../components/confirm-modal/confirm-modal.component';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  private modalService = inject(NgbModal);

  confirm(options: ConfirmOptions | string): Observable<boolean> {
    const config: ConfirmOptions = typeof options === 'string' ? { message: options } : options;

    const modalRef: NgbModalRef = this.modalService.open(ConfirmModalComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: true,
    });

    modalRef.componentInstance.title = config.title || 'Confirmar';
    modalRef.componentInstance.message = config.message;
    modalRef.componentInstance.confirmText = config.confirmText || 'Aceptar';
    modalRef.componentInstance.cancelText = config.cancelText || 'Cancelar';
    modalRef.componentInstance.variant = config.variant || 'primary';
    modalRef.componentInstance.loading = false;

    const result$ = new Subject<boolean>();

    modalRef.result.then(
      (result) => {
        result$.next(true);
        result$.complete();
      },
      (reason) => {
        result$.next(false);
        result$.complete();
      }
    );

    return result$.asObservable();
  }

  confirmWithAction<T>(options: ConfirmOptions | string, action: () => Observable<T>): Observable<T | null> {
    const config: ConfirmOptions = typeof options === 'string' ? { message: options } : options;

    const modalRef: NgbModalRef = this.modalService.open(ConfirmModalComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.title = config.title || 'Confirmar';
    modalRef.componentInstance.message = config.message;
    modalRef.componentInstance.confirmText = config.confirmText || 'Aceptar';
    modalRef.componentInstance.cancelText = config.cancelText || 'Cancelar';
    modalRef.componentInstance.variant = config.variant || 'primary';
    modalRef.componentInstance.loading = false;

    const result$ = new Subject<T | null>();

    // Override the confirm method to handle the action
    const originalConfirm = modalRef.componentInstance.confirm.bind(modalRef.componentInstance);
    modalRef.componentInstance.confirm = () => {
      modalRef.componentInstance.loading = true;
      action().subscribe({
        next: (actionResult) => {
          modalRef.componentInstance.loading = false;
          setTimeout(() => {
            modalRef.close();
            result$.next(actionResult);
            result$.complete();
          }, 300);
        },
        error: (error) => {
          modalRef.componentInstance.loading = false;
          result$.error(error);
        }
      });
    };

    // Handle cancel/dismiss
    modalRef.result.catch(() => {
      result$.next(null);
      result$.complete();
    });

    return result$.asObservable();
  }
}