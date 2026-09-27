import { Component, effect, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { SpacingStylesI } from 'app/shared/interfaces/design.interface';

@Component({
  selector: 'design-spacing-component',
  imports: [FormField, TooltipDirective],
  template: `
    <details class="group/sec" open="">
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-expand"></i>
          <span>2. Espaciado &amp; Box Model</span>
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
          <span class="absolute top-1 left-2 text-[9px] font-bold text-amber-600"
            >Margin: {{ spacing().margin }}</span
          >
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
                >Padding: {{ spacing().padding }}</span
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
        <!-- Linked numeric inputs -->
        <div class="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span class="text-slate-500 font-medium block mb-1">Padding Shorthand</span>
            <input
              class="w-full border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-0 focus:shadow-xs"
              type="text"
              [formField]="spacingForm.padding"
            />
          </div>
          <div>
            <span class="text-slate-500 font-medium block mb-1">Margin Shorthand</span>
            <input
              class="w-full border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none focus:ring-0 focus:shadow-xs"
              type="text"
              [formField]="spacingForm.margin"
            />
          </div>
        </div>
      </div>
    </details>
  `,
})
export class DesignSpacingComponent {
  value = input.required<SpacingStylesI>();

  spacing = signal<SpacingStylesI>({
    margin: '0',
    marginTop: '0',
    marginRight: '0',
    marginBottom: '0',
    marginLeft: '0',
    padding: '12px 24px',
    paddingTop: '12px',
    paddingRight: '24px',
    paddingBottom: '12px',
    paddingLeft: '24px',
  });

  spacingForm = form(this.spacing);

  private syncing = false;
  private previous = this.spacing();

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const value = this.value();
      if (!value) return;
      this.syncing = true;
      this.spacing.set(value);
      this.previous = value;
      this.syncing = false;
    });

    // Sincronización bidireccional
    effect(() => {
      if (this.syncing) return;

      const current = this.spacing();
      const prev = this.previous;

      this.syncing = true;

      const next = { ...current };

      // -------- PADDING --------
      if (current.padding !== prev.padding) {
        const p = this.parseSpacing(current.padding);
        next.paddingTop = p.top;
        next.paddingRight = p.right;
        next.paddingBottom = p.bottom;
        next.paddingLeft = p.left;
      } else if (
        current.paddingTop !== prev.paddingTop ||
        current.paddingRight !== prev.paddingRight ||
        current.paddingBottom !== prev.paddingBottom ||
        current.paddingLeft !== prev.paddingLeft
      ) {
        next.padding = this.composeSpacing(
          current.paddingTop,
          current.paddingRight,
          current.paddingBottom,
          current.paddingLeft,
        );
      }

      // -------- MARGIN --------
      if (current.margin !== prev.margin) {
        const m = this.parseSpacing(current.margin);
        next.marginTop = m.top;
        next.marginRight = m.right;
        next.marginBottom = m.bottom;
        next.marginLeft = m.left;
      } else if (
        current.marginTop !== prev.marginTop ||
        current.marginRight !== prev.marginRight ||
        current.marginBottom !== prev.marginBottom ||
        current.marginLeft !== prev.marginLeft
      ) {
        next.margin = this.composeSpacing(
          current.marginTop,
          current.marginRight,
          current.marginBottom,
          current.marginLeft,
        );
      }

      if (JSON.stringify(next) !== JSON.stringify(current)) {
        this.spacing.set(next);
      }

      this.previous = next;
      this.syncing = false;
    });
  }

  private parseSpacing(value: string) {
    const values = value.trim().split(/\s+/);

    switch (values.length) {
      case 1:
        return {
          top: values[0],
          right: values[0],
          bottom: values[0],
          left: values[0],
        };

      case 2:
        return {
          top: values[0],
          right: values[1],
          bottom: values[0],
          left: values[1],
        };

      case 3:
        return {
          top: values[0],
          right: values[1],
          bottom: values[2],
          left: values[1],
        };

      default:
        return {
          top: values[0] ?? '0',
          right: values[1] ?? '0',
          bottom: values[2] ?? '0',
          left: values[3] ?? '0',
        };
    }
  }

  private composeSpacing(top: string, right: string, bottom: string, left: string) {
    if (top === right && right === bottom && bottom === left) {
      return top;
    }

    if (top === bottom && right === left) {
      return `${top} ${right}`;
    }

    if (right === left) {
      return `${top} ${right} ${bottom}`;
    }

    return `${top} ${right} ${bottom} ${left}`;
  }
}
