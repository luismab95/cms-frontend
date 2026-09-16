import { Component, ElementRef, input, output, signal, ViewChild } from '@angular/core';
import { TabI } from 'app/shared/interfaces/drawer.interface';

@Component({
  selector: 'tabs-component',
  templateUrl: './tabs.html',
  imports: [],
})
export class TabsComponent {
  @ViewChild('contentScroll') contentScroll!: ElementRef<HTMLDivElement>;

  tabs = input.required<TabI[]>();
  selectedTabEvent = output<number>();

  selectedTab = signal<number>(0);

  /**
   * Event select panel
   * @param panel
   * @param index
   */
  onSelectTab(tab: number) {
    this.selectedTab.set(tab);
    this.selectedTabEvent.emit(tab);
    this.contentScroll.nativeElement.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  }
}
