import { Component, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { DrawerI } from '@shared/interfaces';

@Component({
  selector: 'drawer-component',
  templateUrl: './drawer.html',
  imports: [],
})
export class DrawerComponent {
  readonly contentScroll = viewChild.required<ElementRef<HTMLDivElement>>('contentScroll');

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
    this.contentScroll().nativeElement.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  }
}
