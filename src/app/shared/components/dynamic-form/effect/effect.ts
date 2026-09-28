import { Component, effect, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { form, FormField, max, min, schema } from '@angular/forms/signals';
import { EffectsStylesI, BoxShadowT } from 'app/shared/interfaces/design.interface';

@Component({
  selector: 'design-effect-component',
  imports: [FormField, DecimalPipe],
  template: `
    <details class="group/sec">
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-wand-magic-sparkles"></i>

          <span>7. Efectos &amp; Transiciones</span>
        </div>

        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>

      <div class="p-3.5 space-y-3 bg-white">
        <div class="flex items-center justify-between">
          <span class="text-slate-600 text-[10px] font-medium">
            opacity: {{ effect().opacity }}
          </span>

          <div class="flex items-center gap-2 w-36">
            <input
              class="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer"
              type="range"
              step="0.01"
              [formField]="effectForm.opacity"
            />

            <span class="text-[10px] text-indigo-700 font-bold w-8 text-right">
              {{ effect().opacity * 100 | number: '1.0-0' }}%
            </span>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-slate-600 text-[10px] font-medium"> box-shadow </span>

            <span class="text-[10px] text-indigo-600 font-bold">
              {{ effect().boxShadow }}
            </span>
          </div>

          <div
            class="grid grid-cols-4 gap-1 bg-slate-100 p-0.5 rounded text-[10px] font-medium text-slate-600 text-center"
          >
            @for (value of boxShadows; track value) {
              <button
                type="button"
                (click)="setBoxShadow(value)"
                [class.bg-white!]="effect().boxShadow === value"
                [class.text-indigo-700!]="effect().boxShadow === value"
                [class.font-bold!]="effect().boxShadow === value"
                [class.shadow-xs!]="effect().boxShadow === value"
                class="cursor-pointer py-0.5 hover:bg-white/80 rounded transition-all"
              >
                {{ value }}
              </button>
            }
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> transform </label>

            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="effectForm.transform"
            />
          </div>

          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> transition </label>

            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="effectForm.transition"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> filter </label>

            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="effectForm.filter"
            />
          </div>

          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">
              backdrop-filter
            </label>

            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="effectForm.backdropFilter"
            />
          </div>
        </div>
      </div>
    </details>
  `,
})
export class DesignEffectsComponent {
  value = input.required<EffectsStylesI>();

  updateValues = output<Record<string, string | number>>();

  readonly boxShadows: BoxShadowT[] = ['none', 'weak', 'medium', 'strong'];

  effect = signal<Required<EffectsStylesI>>({
    opacity: 1,
    boxShadow: 'none',
    transform: '',
    transition: '',
    filter: '',
    backdropFilter: '',
  });

  effectForm = form(
    this.effect,
    schema((path) => {
      min(path.opacity, 0);
      max(path.opacity, 1);
    }),
  );

  private isInitializing = true;

  private readonly boxShadowValues: Record<BoxShadowT, string> = {
    none: 'none',
    weak: '0 1px 3px rgba(0, 0, 0, 0.12)',
    medium: '0 4px 10px rgba(0, 0, 0, 0.15)',
    strong: '0 10px 25px rgba(0, 0, 0, 0.20)',
  };

  constructor() {
    effect(() => {
      const value = this.value();

      if (!value) {
        return;
      }

      this.isInitializing = true;

      this.effect.update((current) => ({
        ...current,
        ...value,
      }));

      queueMicrotask(() => {
        this.isInitializing = false;
      });
    });

    effect(() => {
      const value = this.effect();

      if (this.isInitializing) {
        return;
      }

      this.updateValues.emit(value as unknown as Record<string, string | number>);
    });
  }

  /**
   * Sets the selected box-shadow preset.
   *
   * @param value Box-shadow preset.
   */
  setBoxShadow(value: BoxShadowT): void {
    this.effect.update((current) => ({
      ...current,
      boxShadow: value,
    }));
  }

  /**
   * Returns the CSS value for a box-shadow preset.
   *
   * @param value Box-shadow preset.
   * @returns Valid CSS box-shadow value.
   */
  getBoxShadowCss(value: BoxShadowT): string {
    return this.boxShadowValues[value];
  }
}
