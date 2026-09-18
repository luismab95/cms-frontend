import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { TabI } from 'app/shared/interfaces/drawer.interface';

@Component({
  selector: 'tabs-component',
  templateUrl: './tabs.html',
  imports: [],
})
export class TabsComponent implements AfterViewInit {
  @ViewChild('contentScroll') contentScroll!: ElementRef<HTMLDivElement>;
  @ViewChild('tabsContainer')
  tabsContainer!: ElementRef<HTMLDivElement>;

  tabs = input.required<TabI[]>();
  selectedTabEvent = output<number>();

  showLeftArrow = signal(false);
  showRightArrow = signal(false);
  selectedTab = signal<number>(0);

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const tabs = this.tabs();
      if (tabs.length > 0) this.selectedTab.set(tabs[0].id);
    });
  }

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

  /**
   * After view Init
   */
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.checkTabsScroll();
    });
  }

  /**
   * Check scroll
   * @returns
   */
  checkTabsScroll(): void {
    const element = this.tabsContainer?.nativeElement;
    if (!element) return;
    this.showLeftArrow.set(element.scrollLeft > 0);
    this.showRightArrow.set(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }

  /***
   * Scroll tabs
   */
  scrollTabs(direction: 'left' | 'right'): void {
    const element = this.tabsContainer?.nativeElement;
    if (!element) return;
    element.scrollBy({
      left: direction === 'left' ? -160 : 160,
      behavior: 'smooth',
    });
  }
}
