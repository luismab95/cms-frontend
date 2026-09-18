import { Component, effect, inject, OnDestroy, OnInit, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ElementService } from 'app/core/services/element.service';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'elements-manager-component',
  templateUrl: './elements-manager.html',
  styles: [
    `
      .card-component {
        transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .card-component:hover {
        transform: translateY(-2px);
        box-shadow:
          0 8px 20px -4px rgba(99, 102, 241, 0.12),
          0 4px 6px -2px rgba(0, 0, 0, 0.04);
        border-color: #a5b4fc;
      }
    `,
  ],
  imports: [ReactiveFormsModule, FormsModule],
})
export class ElementsManagerComponent implements OnInit, OnDestroy {
  elementSelected = output<ElementCMSI>();

  selectedElement = signal<ElementCMSI | null>(null);
  elementsSearch = signal<ElementCMSI[]>([]);

  searchInputControl: FormControl = new FormControl();

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _elementService = inject(ElementService);

  readonly elements = toSignal(this._elementService.elements$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const elements = this.elements().records;
      this.elementsSearch.set(elements);
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to search input field value changes
    this.searchInputControl.valueChanges
      .pipe(debounceTime(700), takeUntil(this._unsubscribeAll))
      .subscribe((search: string) => {
        if (search) this.search(search);
      });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Set element
   * @param element
   */
  selectElememt(element: ElementCMSI) {
    this.selectedElement.set(element);
  }

  /**
   * Add element
   */
  addElement(element: ElementCMSI) {
    this.elementSelected.emit(element);
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.searchInputControl.reset();
    this.elementsSearch.set(this.elements().records);
  }

  /**
   * Search navigation
   * @param term
   * @returns
   */
  private search(term: string): void {
    const query = term.trim();

    if (!query) {
      this.elementsSearch.set([]);
      return;
    }

    const result = this.elements().records.filter(
      (element) =>
        element.name.toLowerCase().includes(term) ||
        element.description.toLowerCase().includes(term),
    );
    this.elementsSearch.set(result);
  }
}
