import { Component, effect, input, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { OverflowStylesI, OverflowT } from 'app/shared/interfaces/design.interface';
import { defaultOverflowStyles } from 'app/shared/utils/grid.utils';

@Component({
  selector: 'design-overflow-component',
  imports: [FormField],
  template: `
    <details class="group/sec">
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-water"></i>
          <span>8. Desbordamiento</span>
        </div>
        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>
      <div class="p-3.5 space-y-2.5 bg-white">
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] text-slate-500 font-medium">overflow</label>
            <span class="text-[10px] text-indigo-600 font-bold">'{{ overflow().overflow }}'</span>
          </div>
          <div class="grid grid-cols-4 gap-1 bg-slate-100 p-0.5 rounded text-center text-[10px]">
            @for (value of overflows; track value) {
              <button
                (click)="overflowForm.overflow().value.set(value)"
                [class.bg-white!]="overflow().overflow === value"
                [class.text-indigo-700e!]="overflow().overflow === value"
                [class.font-bold!]="overflow().overflow === value"
                [class.shadow-xs!]="overflow().overflow === value"
                class="cursor-pointer py-1 rounded hover:bg-white text-slate-600"
              >
                {{ value }}
              </button>
            }
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">overflow-x</label>
            <select
              [formField]="overflowForm.overflowX"
              class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              @for (value of overflows; track value) {
                <option [value]="value">{{ value }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">overflow-y</label>
            <select
              [formField]="overflowForm.overflowY"
              class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              @for (value of overflows; track value) {
                <option [value]="value">{{ value }}</option>
              }
            </select>
          </div>
        </div>
      </div>
    </details>
  `,
})
export class DesignOverflowComponent {
  value = input.required<OverflowStylesI>();
  updateValues = output<Record<string, string>>();

  readonly overflows: OverflowT[] = ['visible', 'hidden', 'scroll', 'auto'];

  overflow = signal<Required<OverflowStylesI>>(defaultOverflowStyles);

  overflowForm = form(this.overflow);

  private isInitializing = true;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const value = this.value();
      if (!value) return;

      this.isInitializing = true;
      this.overflow.update((current) => ({
        ...current,
        ...value,
      }));

      queueMicrotask(() => {
        this.isInitializing = false;
      });
    });

    effect(() => {
      const value = this.overflow();
      if (this.isInitializing) return;

      this.updateValues.emit(value);
    });
  }
}
