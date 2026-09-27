import { Component, effect, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { form, FormField, max, min, schema } from '@angular/forms/signals';
import { EffectsStylesI, BoxShadowT } from 'app/shared/interfaces/design.interface';

@Component({
  selector: 'design-effect-component',
  imports: [FormField, DecimalPipe],
  template: `
    <details class="group/sec" open="">
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
        <!-- Opacity Slider -->
        <div class="flex items-center justify-between">
          <span class="text-slate-600 text-[10px] font-medium"
            >opacity: {{ effect().opacity }}</span
          >
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
        <!-- Box Shadow (none) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-slate-600 text-[10px] font-medium">box-shadow</span>
            <span class="text-[10px] text-indigo-600 font-bold"> '{{ effect().boxShadow }}' </span>
          </div>
          <div
            class="grid grid-cols-4 gap-1 bg-slate-100 p-0.5 rounded text-[10px] font-medium text-slate-600 text-center"
          >
            @for (value of boxShadows; track value) {
              <button
                (click)="effectForm.boxShadow().value.set(value)"
                [class.bg-white!]="effect().boxShadow === value"
                [class.text-indigo-7001]="effect().boxShadow === value"
                [class.font-bold!]="effect().boxShadow === value"
                [class.shadow-xs!]="effect().boxShadow === value"
                class="cursor-pointer py-0.5 hover:bg-white/80 rounded transition-all"
              >
                {{ value }}
              </button>
            }
          </div>
        </div>
        <!-- Transform & Transition -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">transform</label>
            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="effectForm.transform"
            />
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">transition</label>
            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="effectForm.transition"
            />
          </div>
        </div>
        <!-- Filter & Backdrop Filter -->
        <div class="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">filter</label>
            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="effectForm.filter"
            />
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"
              >backdrop-filte</label
            >
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

  readonly boxShadows: BoxShadowT[] = ['none', 'weak', 'medium', 'strong'];

  effect = signal<EffectsStylesI>({
    opacity: 1,
    boxShadow: 'none',
    transform: 'none',
    transition: 'all 0.3s ease',
    filter: 'none',
    backdropFilter: 'none',
  });

  effectForm = form(
    this.effect,
    schema((path) => {
      min(path.opacity, 0);
      max(path.opacity, 1);
    }),
  );

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const value = this.value();
      if (!value) return;
      this.effect.set(value);
    });
  }
}
