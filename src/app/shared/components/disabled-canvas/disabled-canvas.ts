import { Component, output } from '@angular/core';

@Component({
  selector: 'disabled-canvas-component',
  templateUrl: './disabled-canvas.html',
  imports: [],
})
export class DisabledCanvasComponent {
  goBackEvent = output<void>();
  
  /**
   * Go to back event
   */
  goToBack() {
    this.goBackEvent.emit();
  }
}
