import { Component, computed, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { NgSelectComponent } from '@ng-select/ng-select';

type PageItem = number | '...';

@Component({
  selector: 'pagination-component',
  templateUrl: './pagination.html',
  imports: [NgSelectComponent, FormField],
})
export class PaginationComponent {
  readonly page = input<number>(1);
  readonly pages = input<number>(1);
  readonly limit = input<number>(10);
  readonly total = input<number>(0);
  readonly showLimit = input<boolean>(true);
  readonly pageEvent = output<number>();
  readonly limitEvent = output<number>();

  readonly model = signal({ limit: this.limit() });
  readonly limitForm = form(this.model, (path) => required(path.limit));

  readonly pageNumbers = computed<PageItem[]>(() => {
    const current = this.page();
    const totalPages = this.pages();

    if (totalPages <= 1) return [1];
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const result: PageItem[] = [];
    result.push(1);

    if (current <= 4) {
      result.push(2, 3, 4, 5);
      result.push('...');
      result.push(totalPages);
      return result;
    }

    if (current >= totalPages - 3) {
      result.push('...');
      result.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      return result;
    }

    result.push('...');
    result.push(current - 1, current, current + 1);
    result.push('...');
    result.push(totalPages);

    return result;
  });
  readonly startItem = computed(() => {
    if (this.total() === 0) return 0;
    return (this.page() - 1) * this.limit() + 1;
  });
  readonly endItem = computed(() => {
    return Math.min(this.page() * this.limit(), this.total());
  });

  /**
   *  Page change
   * @param page
   * @returns
   */
  changeEvent(page: number): void {
    if (page < 1 || page > this.pages() || page === this.page()) return;
    this.pageEvent.emit(page);
  }

  /**
   * Limit change
   * @param event
   */
  changeLimit(limit: number): void {
    this.limitEvent.emit(limit);
  }

  /**
   * Go to first page
   */
  firstPage(): void {
    this.changeEvent(1);
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    this.changeEvent(this.page() - 1);
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    this.changeEvent(this.page() + 1);
  }

  /**
   * Go to last page
   */
  lastPage(): void {
    this.changeEvent(this.pages());
  }
}
