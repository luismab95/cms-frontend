import { Component, computed, effect, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { PositionStylesI, PositionT } from 'app/shared/interfaces/design.interface';

@Component({
  selector: 'design-position-component',
  imports: [FormField],
  template: `
    <details class="group/sec" open="">
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-compass"></i>
          <span>6. Posicionamiento</span>
        </div>
        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>
      <div class="p-3.5 space-y-3 bg-white">
        <div class="grid grid-cols-1 gap-2">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">position</label>
            <select
              [formField]="positionForm.position"
              (change)="resetPropertiesForPosition()"
              class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              @for (value of positions; track value) {
                <option [value]="value">{{ value }}</option>
              }
            </select>
          </div>
          @if (!isStatic()) {
            <div>
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5">z-index</label>
              <input
                [formField]="positionForm.zIndex"
                class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
              />
            </div>
          }
        </div>
        @if (!isStatic()) {
          <!-- Coordinates Top, Right, Bottom, Left: auto -->
          <div class="grid grid-cols-4 gap-1 text-[10px]">
            <div class="border border-slate-200 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block">Top</span>
              <input
                class="w-full border-0 p-0 text-center text-[10px] text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="positionForm.top"
              />
            </div>
            <div class="border border-slate-200 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block">Right</span>
              <input
                class="w-full border-0 p-0 text-center text-[10px] text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
                [formField]="positionForm.right"
              />
            </div>
            <div class="border border-slate-200 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block">Bottom</span>
              <input
                class="w-full border-0 p-0 text-center text-[10px] text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="positionForm.bottom"
              />
            </div>
            <div class="border border-slate-200 rounded p-1 text-center">
              <span class="text-[8px] text-slate-400 block">Left</span>
              <input
                class="w-full border-0 p-0 text-center text-[10px] text-slate-600 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
                [formField]="positionForm.left"
              />
            </div>
          </div>
        }
      </div>
    </details>
  `,
})
export class DesignPositionComponent {
  value = input.required<PositionStylesI>();

  readonly positions: PositionT[] = ['relative', 'absolute', 'static', 'sticky', 'fixed'];

  readonly isStatic = computed(() => this.position().position === 'static');

  position = signal<PositionStylesI>({
    position: 'relative',
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto',
    zIndex: '1',
  });

  positionForm = form(this.position);

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const value = this.value();
      if (!value) return;
      this.position.set(value);
    });
  }

  /**
   * reset properties
   */
  resetPropertiesForPosition(): void {
    this.position.update((prev) => {
      switch (prev.position) {
        case 'static':
          return {
            ...prev,
            top: 'auto',
            right: 'auto',
            bottom: 'auto',
            left: 'auto',
            zIndex: 'auto',
          };
        case 'relative':
          return {
            ...prev,
            zIndex: prev.zIndex || 'auto',
          };
        case 'absolute':
          return {
            ...prev,
            zIndex: prev.zIndex || 'auto',
          };
        case 'fixed':
          return {
            ...prev,
            zIndex: prev.zIndex || 'auto',
          };
        case 'sticky':
          return {
            ...prev,
            zIndex: prev.zIndex || 'auto',
          };
        default:
          return {
            ...prev,
            top: 'auto',
            right: 'auto',
            bottom: 'auto',
            left: 'auto',
            zIndex: 'auto',
          };
      }
    });
  }
}
