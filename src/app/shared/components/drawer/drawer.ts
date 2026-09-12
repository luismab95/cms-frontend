import { Component, input, output, signal } from '@angular/core';
import { DrawerI } from 'app/shared/interfaces/drawer.interface';

@Component({
  selector: 'drawer-component',
  templateUrl: './drawer.html',
  imports: [],
})
export class DrawerComponent {
  panels = input.required<DrawerI[]>();
  selectedPanelEvent = output<string>();

  selectedPanel = signal<number>(0);
  height = signal<number>(window.innerHeight);

  /**
   * Event select panel
   * @param panel
   * @param index
   */
  onSelectPanel(panel: string, index: number) {
    this.selectedPanel.set(index);
    this.selectedPanelEvent.emit(panel);
  }
}
