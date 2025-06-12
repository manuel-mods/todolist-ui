import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CustomModalComponent } from './custom-modal.component';

@Injectable({
  providedIn: 'root',
})
export class CustomModalService {
  constructor(private modalService: NgbModal) {}

  open(title: string, message: string, icon: string, backdrop = true): Promise<void> {
    const modalRef = this.modalService.open(CustomModalComponent, { centered: true, backdrop: backdrop});

    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;
    modalRef.componentInstance.icon = icon;
    // emit confirm on customcomponent and return resolve
    return new Promise<void>((resolve, reject) => {
      modalRef.componentInstance.confirm.subscribe(() => {
        resolve();
      });
      // emit cancel on customcomponent and return reject
      modalRef.componentInstance.cancel.subscribe(() => {
        modalRef.dismiss();
        reject();
      });
    });
  }
  close() {
    this.modalService.dismissAll();
  }
}
