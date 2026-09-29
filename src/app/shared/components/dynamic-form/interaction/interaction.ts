import { Component, effect, input, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  CursorT,
  InteractionStylesI,
  PointerEventsT,
} from 'app/shared/interfaces/design.interface';
import { defaultInteractionStyles } from 'app/shared/utils/grid.utils';

@Component({
  selector: 'design-interaction-component',
  imports: [FormField],
  template: `
    <details class="group/sec">
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-arrow-pointer"></i>
          <span>9. Interacción</span>
        </div>
        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>
      <div class="p-3.5 space-y-2.5 bg-white">
        <div>
          <label class="text-[10px] text-slate-500 font-medium block mb-0.5">cursor</label>
          <select
            [formField]="interactionForm.cursor"
            class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
          >
            @for (value of cursors; track value) {
              <option [value]="value">{{ value }}</option>
            }
          </select>
        </div>
        <div>
          <label class="text-[10px] text-slate-500 font-medium block mb-0.5">pointer-events</label>
          <select
            [formField]="interactionForm.pointerEvents"
            class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
          >
            @for (value of pointerEvents; track value) {
              <option [value]="value">{{ value }}</option>
            }
          </select>
        </div>
      </div>
    </details>
  `,
})
export class DesignInteractionComponent {
  value = input.required<InteractionStylesI>();
  updateValues = output<Record<string, string>>();

  readonly cursors: CursorT[] = [
    'auto',
    'default',
    'pointer',
    'move',
    'text',
    'wait',
    'help',
    'not-allowed',
    'grab',
    'grabbing',
    'crosshair',
    'zoom-in',
    'zoom-out',
  ];
  readonly pointerEvents: PointerEventsT[] = ['none', 'auto'];

  interaction = signal<Required<InteractionStylesI>>(defaultInteractionStyles);

  interactionForm = form(this.interaction);

  private isInitializing = true;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const value = this.value();
      if (!value) return;

      this.isInitializing = true;

      this.interaction.update((current) => ({
        ...current,
        ...value,
      }));

      queueMicrotask(() => {
        this.isInitializing = false;
      });
    });

    effect(() => {
      const value = this.interaction();
      if (this.isInitializing) return;

      this.updateValues.emit(value);
    });
  }
}
