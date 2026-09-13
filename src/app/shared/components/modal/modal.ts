import { Component, OnInit, output } from '@angular/core';

@Component({
  selector: 'modal-component',
  templateUrl: './modal.html',
})
export class ModalComponent implements OnInit {
  closeModalEvent = output<boolean>();

  /**
   * Constructor
   */
  constructor() {}

  /**
   * On Init
   */
  ngOnInit(): void {}

  /**
   * Close Modal
   */
  closeModal(load: boolean) {
    this.closeModalEvent.emit(load);
  }
}
