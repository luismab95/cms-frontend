import { Component, effect, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { BorderStylesI, BorderStyleT } from 'app/shared/interfaces/design.interface';

@Component({
  selector: 'design-border-component',
  imports: [FormField],
  template: `
    <details class="group/sec" open>
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-square"></i>
          <span>5. Bordes &amp; Radios</span>
        </div>
        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>

      <div class="p-3.5 space-y-3 bg-white">
        <!-- Border color -->
        <div class="grid grid-cols-1 gap-1.5">
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5">
                border-color
              </label>
              <span class="text-[10px] text-indigo-600 font-bold">
                {{ border().borderColor }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <input
                class="w-full h-7 border border-slate-200 rounded px-1 py-0.5 text-xs text-slate-700 focus:ring-0 focus:outline-none cursor-pointer focus:shadow-xs"
                type="color"
                [formField]="borderForm.borderColor"
              />
            </div>
          </div>
        </div>

        <!-- Border width / style -->
        <div class="grid grid-cols-2 gap-1.5">
          <div>
            <label class="text-[9px] text-slate-500 font-medium block mb-0.5"> border-width </label>
            <div class="relative">
              <input
                class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="borderForm.borderWidth"
              />
            </div>
          </div>
          <div>
            <label class="text-[9px] text-slate-500 font-medium block mb-0.5"> border-style </label>
            <select
              [formField]="borderForm.borderStyle"
              class="w-full border border-slate-200 rounded py-0.5 px-1.5 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              @for (value of borderStyles; track value) {
                <option [value]="value">
                  {{ value }}
                </option>
              }
            </select>
          </div>
        </div>

        <!-- Individual borders -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-[10px] text-slate-500 font-medium"> Bordes individuales </label>
            <button
              type="button"
              class="cursor-pointer text-[9px] text-indigo-600 hover:text-indigo-800 font-medium"
              (click)="resetIndividualBorders()"
            >
              Restablecer
            </button>
          </div>
          <!-- Top -->
          <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
            <span class="text-[9px] text-slate-500 font-medium"> Top </span>
            <input
              class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              placeholder="none"
              [formField]="borderForm.borderTop"
            />
          </div>
          <!-- Right -->
          <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
            <span class="text-[9px] text-slate-500 font-medium"> Right </span>
            <input
              class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              placeholder="none"
              [formField]="borderForm.borderRight"
            />
          </div>
          <!-- Bottom -->
          <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
            <span class="text-[9px] text-slate-500 font-medium"> Bottom </span>
            <input
              class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              placeholder="text"
              [formField]="borderForm.borderBottom"
            />
          </div>
          <!-- Left -->
          <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
            <span class="text-[9px] text-slate-500 font-medium"> Left </span>
            <input
              class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              placeholder="none"
              [formField]="borderForm.borderLeft"
            />
          </div>
        </div>

        <!-- Border radius -->
        <div>
          <label class="text-[9px] text-slate-500 font-medium block mb-0.5"> border-radius </label>
          <input
            class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
            type="text"
            placeholder="0"
            [formField]="borderForm.borderRadius"
          />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-[10px] text-slate-500 font-medium">
              Bordes radius individuales
            </label>
            <button
              type="button"
              class="cursor-pointer text-[9px] text-indigo-600 hover:text-indigo-800 font-medium"
              (click)="resetIndividualRadiusBorders()"
            >
              Restablecer
            </button>
          </div>

          <!-- 4 corners -->
          <div class="grid grid-cols-4 gap-1">
            <!-- TL -->
            <div class="border border-indigo-200 bg-indigo-50/20 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block"> TL </span>
              <input
                class="w-full border-0 bg-transparent p-0 text-center text-xs font-bold text-indigo-800 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="borderForm.borderTopLeftRadius"
              />
            </div>

            <!-- TR -->
            <div class="border border-indigo-200 bg-indigo-50/20 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block"> TR </span>
              <input
                class="w-full border-0 bg-transparent p-0 text-center text-xs font-bold text-indigo-800 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="borderForm.borderTopRightRadius"
              />
            </div>

            <!-- BR -->
            <div class="border border-indigo-200 bg-indigo-50/20 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block"> BR </span>
              <input
                class="w-full border-0 bg-transparent p-0 text-center text-xs font-bold text-indigo-800 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="borderForm.borderBottomRightRadius"
              />
            </div>

            <!-- BL -->
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

  border = signal<BorderStylesI>({
    border: 'none',
    borderWidth: '0',
    borderStyle: 'none',
    borderColor: '#6200ea',
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
    borderRadius: '50px',
    borderTopLeftRadius: '50px',
    borderTopRightRadius: '50px',
    borderBottomRightRadius: '50px',
    borderBottomLeftRadius: '50px',
  });

  borderForm = form(this.border);

  readonly borderStyles: BorderStyleT[] = ['none', 'solid', 'dashed', 'dotted', 'double'];

  constructor() {
    effect(() => {
      const value = this.value();
      if (!value) return;
      this.border.set(value);
    });
  }

  /**
   * reset borders
   */
  resetIndividualBorders(): void {
    this.border.update((value) => ({
      ...value,
      borderTop: 'none',
      borderRight: 'none',
      borderBottom: 'none',
      borderLeft: 'none',
    }));
  }

  resetIndividualRadiusBorders(): void {
    this.border.update((value) => ({
      ...value,
      borderTopLeftRadius: '0px',
      borderTopRightRadius: '0px',
      borderBottomRightRadius: '0px',
      borderBottomLeftRadius: '0px',
    }));
  }
}
