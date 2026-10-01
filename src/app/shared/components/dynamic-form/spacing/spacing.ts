import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { SpacingStylesI } from 'app/shared/interfaces/design.interface';
import { defaultSpacingStyles } from 'app/shared/utils/grid.utils';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'design-spacing-component',
  imports: [FormField, TooltipDirective],
  template: `
    <details class="group/sec">
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-expand"></i>
          <span>Espaciado &amp; Box Model</span>
        </div>
        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>
      <div class="p-3.5 space-y-3 bg-white">
        <!-- Box Model Interactive Diagram with Exact Values: Margin 0, Padding 12px 24px -->
        <div
          class="bg-amber-50/40 border border-amber-200/80 rounded-lg p-2.5 text-[10px] flex flex-col items-center justify-center relative"
        >
          <span class="absolute top-1 left-2 text-[9px] font-bold text-amber-600">Margin</span>
          <input
            class="w-8 h-4 text-center border border-amber-300 rounded text-[10px] p-0 bg-white mb-1 shadow-2xs font-bold text-slate-700 focus:outline-none focus:ring-0 focus:shadow-xs"
            appTooltip="Margin Top"
            type="text"
            [formField]="spacingForm.marginTop"
          />
          <div class="w-full flex items-center justify-between px-1">
            <input
              class="w-8 h-4 text-center border border-amber-300 rounded text-[10px] p-0 bg-white shadow-2xs font-bold text-slate-700 mt-3 focus:outline-none focus:ring-0 focus:shadow-xs"
              appTooltip="Margin Left"
              type="text"
              [formField]="spacingForm.marginLeft"
            />
            <!-- Inner Padding Box: Top/Bottom 12px, Left/Right 24px -->
            <div
              class="bg-indigo-50/80 border border-indigo-200 rounded-md p-1.5 flex-1 mx-1.5 flex flex-col items-center relative"
            >
              <span class="absolute top-0.5 left-1.5 text-[8px] font-bold text-indigo-700"
                >Padding</span
              >
              <input
                class="w-8 h-4 text-center border border-indigo-300 rounded text-[9px] p-0 bg-white mb-1 text-indigo-800 font-bold mt-3 focus:outline-none focus:ring-0 focus:shadow-xs"
                appTooltip="Padding Top"
                type="text"
                [formField]="spacingForm.paddingTop"
              />
              <div class="w-full flex items-center justify-between px-1">
                <input
                  class="w-8 h-4 text-center border border-indigo-300 rounded text-[9px] p-0 bg-white text-indigo-800 font-bold focus:outline-none focus:ring-0 focus:shadow-xs"
                  appTooltip="Padding Left"
                  type="text"
                  [formField]="spacingForm.paddingLeft"
                />
                <div
                  class="w-14 h-5 bg-indigo-600 text-white rounded flex items-center justify-center text-[8px] font-bold shadow-xs"
                >
                  BTN (CTA)
                </div>
                <input
                  class="w-8 h-4 text-center border border-indigo-300 rounded text-[9px] p-0 bg-white text-indigo-800 font-bold focus:outline-none focus:ring-0 focus:shadow-xs"
                  appTooltip="Padding Right"
                  type="text"
                  [formField]="spacingForm.paddingRight"
                />
              </div>
              <input
                class="w-8 h-4 text-center border border-indigo-300 rounded text-[9px] p-0 bg-white mt-1 text-indigo-800 font-bold focus:outline-none focus:ring-0 focus:shadow-xs"
                appTooltip="Padding Bottom"
                type="text"
                [formField]="spacingForm.paddingBottom"
              />
            </div>
            <input
              class="w-8 h-4 text-center border border-amber-300 rounded text-[10px] p-0 bg-white shadow-2xs font-bold text-slate-700 mt-3 focus:outline-none focus:ring-0 focus:shadow-xs"
              appTooltip="Margin Right"
              type="text"
              [formField]="spacingForm.marginRight"
            />
          </div>
          <input
            class="w-8 h-4 text-center border border-amber-300 rounded text-[10px] p-0 bg-white mt-1 shadow-2xs font-bold text-slate-700 focus:outline-none focus:ring-0 focus:shadow-xs"
            appTooltip="Margin Bottom"
            type="text"
            [formField]="spacingForm.marginBottom"
          />
        </div>
      </div>
    </details>
  `,
})
export class DesignSpacingComponent {
  value = input.required<SpacingStylesI>();
  updateValues = output<Record<string, string>>();

  spacing = signal<Required<SpacingStylesI>>(defaultSpacingStyles);

  spacingForm = form(this.spacing);

  private isInitializing = true;

  private readonly _destroyRef = inject(DestroyRef);

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const value = this.value();
      if (!value) return;
      this.isInitializing = true;
      this.spacing.update((current) => ({
        ...current,
        ...value,
      }));

      queueMicrotask(() => {
        this.isInitializing = false;
      });
    });

    toObservable(this.spacing)
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
