import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { BorderStylesI } from '@shared/interfaces';
import { defaultBorderStyles } from '@shared/utils';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'design-border-component',
  imports: [FormField],
  template: `
    <details class="group/sec">
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-square"></i>
          <span>Bordes &amp; Radios</span>
        </div>
        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>

      <div class="p-3.5 space-y-3 bg-white">
        <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
          <span class="text-[9px] text-slate-500 font-medium"> Top </span>
          <input
            class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
            type="text"
            placeholder="1px solid #000"
            [formField]="borderForm.borderTop"
          />
        </div>

        <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
          <span class="text-[9px] text-slate-500 font-medium"> Right </span>
          <input
            class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
            type="text"
            placeholder="1px solid #000"
            [formField]="borderForm.borderRight"
          />
        </div>

        <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
          <span class="text-[9px] text-slate-500 font-medium"> Bottom </span>
          <input
            class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
            type="text"
            placeholder="1px solid #000"
            [formField]="borderForm.borderBottom"
          />
        </div>

        <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
          <span class="text-[9px] text-slate-500 font-medium"> Left </span>
          <input
            class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
            type="text"
            placeholder="1px solid #000"
            [formField]="borderForm.borderLeft"
          />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-[10px] text-slate-500 font-medium"> Bordes radius </label>
          </div>
          <div class="grid grid-cols-4 gap-1">
            <div class="border border-indigo-200 bg-indigo-50/20 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block"> TL </span>

              <input
                class="w-full border-0 bg-transparent p-0 text-center text-xs font-bold text-indigo-800 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="borderForm.borderTopLeftRadius"
              />
            </div>

            <div class="border border-indigo-200 bg-indigo-50/20 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block"> TR </span>

              <input
                class="w-full border-0 bg-transparent p-0 text-center text-xs font-bold text-indigo-800 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="borderForm.borderTopRightRadius"
              />
            </div>

            <div class="border border-indigo-200 bg-indigo-50/20 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block"> BR </span>

              <input
                class="w-full border-0 bg-transparent p-0 text-center text-xs font-bold text-indigo-800 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="borderForm.borderBottomRightRadius"
              />
            </div>

            <div class="border border-indigo-200 bg-indigo-50/20 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block"> BL </span>

              <input
                class="w-full border-0 bg-transparent p-0 text-center text-xs font-bold text-indigo-800 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="borderForm.borderBottomLeftRadius"
              />
            </div>
          </div>
        </div>
      </div>
    </details>
  `,
})
export class DesignBorderComponent {
  value = input.required<BorderStylesI>();

  updateValues = output<Record<string, string>>();

  border = signal<Required<BorderStylesI>>(defaultBorderStyles);

  borderForm = form(this.border);

  private isInitializing = true;

  private readonly _destroyRef = inject(DestroyRef);

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const value = this.value();

      if (!value) {
        return;
      }

      this.isInitializing = true;
      this.border.update((current) => ({ ...current, ...value }));

      queueMicrotask(() => {
        this.isInitializing = false;
      });
    });

    toObservable(this.border)
      .pipe(
        debounceTime(600),
        distinctUntilChanged(
          (previous, current) => JSON.stringify(previous) === JSON.stringify(current),
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((value) => {
        if (this.isInitializing) return;
        this.updateValues.emit(value);
      });
  }
}
