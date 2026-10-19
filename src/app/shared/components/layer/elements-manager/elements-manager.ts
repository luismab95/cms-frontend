import { Component, DestroyRef, effect, inject, output, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElementService } from '@core/services';
import { ElementCMSI } from '@shared/interfaces';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'elements-manager-component',
  templateUrl: './elements-manager.html',
  imports: [ReactiveFormsModule, FormsModule],
})
export class ElementsManagerComponent {
  elementSelected = output<ElementCMSI>();

  selectedElement = signal<ElementCMSI | null>(null);
  elementsSearch = signal<ElementCMSI[]>([]);

  searchInputControl: FormControl = new FormControl();

  private readonly _elementService = inject(ElementService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly elements = this._elementService.elements;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const elements = this.elements().records.filter((element) => element.status);
      this.elementsSearch.set(elements);
    });
  }

  /**
   * On init
   */
  ngOnInit(): void {
    this.searchInputControl.valueChanges
      .pipe(debounceTime(700), takeUntilDestroyed(this._destroyRef))
      .subscribe((search: string) => {
        if (search) this.search(search);
      });
  }

  /**
   * Set element
   * @param element
   */
  selectElememt(element: ElementCMSI) {
    this.selectedElement.set(element);
  }

  /**
   * Add element
   * @param element
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
