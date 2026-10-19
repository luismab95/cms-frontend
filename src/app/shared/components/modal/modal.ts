import { Component, output } from '@angular/core';

@Component({
  selector: 'modal-component',
  templateUrl: './modal.html',
})
export class ModalComponent {
  closeModalEvent = output<boolean>();

  /**
   * Close Modal
   * @param load
   */
  closeModal(load: boolean) {
    this.closeModalEvent.emit(load);
  }
}
