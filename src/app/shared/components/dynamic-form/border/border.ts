import { Component, effect, input, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { BorderStylesI, BorderStyleT } from 'app/shared/interfaces/design.interface';

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

          <span>5. Bordes &amp; Radios</span>
        </div>

        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>

      <div class="p-3.5 space-y-3 bg-white">
        <div class="grid grid-cols-1 gap-1.5">
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> color </label>

              <span
                [style.color]="border().borderColor === '' ? 'transparent' : border().borderColor"
                class="text-[10px] font-bold"
              >
                '{{ border().borderColor }}'
              </span>
            </div>

            <div
              class="flex items-center gap-1.5 border border-slate-200 rounded px-2 py-0.5 bg-white"
            >
              <input
                type="color"
                [value]="border().borderColor || '#ffffff'"
                (input)="onBackgroundColorChange($event)"
                class="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
              />

              <input
                class="cursor-pointer w-full border-0 p-0 text-xs text-slate-700 uppercase focus:ring-0 focus:outline-none"
                type="text"
                [formField]="borderForm.borderColor"
                placeholder="#000000"
              />
            </div>
          </div>
        </div>

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
                  {{ value === '' ? 'Ninguno' : value }}
                </option>
              }
            </select>
          </div>
        </div>

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

          <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
            <span class="text-[9px] text-slate-500 font-medium"> Top </span>

            <input
              class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              placeholder="none"
              [formField]="borderForm.borderTop"
            />
          </div>

          <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
            <span class="text-[9px] text-slate-500 font-medium"> Right </span>

            <input
              class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              placeholder="none"
              [formField]="borderForm.borderRight"
            />
          </div>

          <div class="grid grid-cols-[45px_1fr] gap-1.5 items-center">
            <span class="text-[9px] text-slate-500 font-medium"> Bottom </span>

            <input
              class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              placeholder="none"
              [formField]="borderForm.borderBottom"
            />
          </div>

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

  updateValues = output<Record<string, string | number>>();

  border = signal<Required<BorderStylesI>>({
    border: '',
    borderWidth: '',
    borderStyle: '',
    borderColor: '',
    borderTop: '',
    borderRight: '',
    borderBottom: '',
    borderLeft: '',
    borderRadius: '',
    borderTopLeftRadius: '',
    borderTopRightRadius: '',
    borderBottomRightRadius: '',
    borderBottomLeftRadius: '',
  });

  borderForm = form(this.border);

  readonly borderStyles: BorderStyleT[] = ['none', 'solid', 'dashed', 'dotted', 'double', ''];

  private isInitializing = true;

  private previousBorder: Required<BorderStylesI> = {
    border: '',
    borderWidth: '',
    borderStyle: '',
    borderColor: '',
    borderTop: '',
    borderRight: '',
    borderBottom: '',
    borderLeft: '',
    borderRadius: '',
    borderTopLeftRadius: '',
    borderTopRightRadius: '',
    borderBottomRightRadius: '',
    borderBottomLeftRadius: '',
  };

  private readonly individualBorders = [
    'borderTop',
    'borderRight',
    'borderBottom',
    'borderLeft',
  ] as const;

  private readonly individualRadiusBorders = [
    'borderTopLeftRadius',
    'borderTopRightRadius',
    'borderBottomRightRadius',
    'borderBottomLeftRadius',
  ] as const;

  constructor() {
    effect(() => {
      const value = this.value();

      if (!value) {
        return;
      }

      this.isInitializing = true;

      this.border.update((current) => ({
        ...current,
        ...value,
      }));

      queueMicrotask(() => {
        this.previousBorder = {
          ...this.border(),
        };

        this.isInitializing = false;
      });
    });

    effect(() => {
      const current = this.border();

      if (this.isInitializing) {
        return;
      }

      const previous = this.previousBorder;

      const changedProperty = this.getChangedProperty(previous, current);

      if (changedProperty) {
        this.syncProperty(changedProperty, current);
      }

      this.previousBorder = {
        ...this.border(),
      };

      this.updateValues.emit(this.border() as unknown as Record<string, string | number>);
    });
  }

  /**
   * Returns the property that changed.
   *
   * @param previous Previous border values.
   * @param current Current border values.
   * @returns The changed property or null.
   */
  private getChangedProperty(
    previous: Required<BorderStylesI>,
    current: Required<BorderStylesI>,
  ): keyof Required<BorderStylesI> | null {
    const keys = Object.keys(current) as Array<keyof Required<BorderStylesI>>;

    for (const key of keys) {
      if (previous[key] !== current[key]) {
        return key;
      }
    }

    return null;
  }

  /**
   * Synchronizes global and individual values.
   *
   * @param property Changed border property.
   * @param current Current border values.
   */
  private syncProperty(
    property: keyof Required<BorderStylesI>,
    current: Required<BorderStylesI>,
  ): void {
    if (property === 'border') {
      const value = current.border;

      this.border.update((current) => ({
        ...current,
        borderTop: value,
        borderRight: value,
        borderBottom: value,
        borderLeft: value,
      }));

      return;
    }

    if (this.individualBorders.includes(property as (typeof this.individualBorders)[number])) {
      this.syncGlobalBorder(current);

      return;
    }

    if (property === 'borderRadius') {
      const value = current.borderRadius;

      this.border.update((current) => ({
        ...current,
        borderTopLeftRadius: value,
        borderTopRightRadius: value,
        borderBottomRightRadius: value,
        borderBottomLeftRadius: value,
      }));

      return;
    }

    if (
      this.individualRadiusBorders.includes(
        property as (typeof this.individualRadiusBorders)[number],
      )
    ) {
      this.syncGlobalRadius(current);
    }
  }

  /**
   * Synchronizes the global border value.
   *
   * @param value Current border values.
   */
  private syncGlobalBorder(value: Required<BorderStylesI>): void {
    const { borderTop, borderRight, borderBottom, borderLeft } = value;

    const allEqual =
      borderTop === borderRight && borderRight === borderBottom && borderBottom === borderLeft;

    const globalBorder = allEqual ? borderTop : '';

    if (value.border === globalBorder) {
      return;
    }

    this.border.update((current) => ({
      ...current,
      border: globalBorder,
    }));
  }

  /**
   * Synchronizes the global radius value.
   *
   * @param value Current border values.
   */
  private syncGlobalRadius(value: Required<BorderStylesI>): void {
    const {
      borderTopLeftRadius,
      borderTopRightRadius,
      borderBottomRightRadius,
      borderBottomLeftRadius,
    } = value;

    const allEqual =
      borderTopLeftRadius === borderTopRightRadius &&
      borderTopRightRadius === borderBottomRightRadius &&
      borderBottomRightRadius === borderBottomLeftRadius;

    const globalRadius = allEqual ? borderTopLeftRadius : '';

    if (value.borderRadius === globalRadius) {
      return;
    }

    this.border.update((current) => ({
      ...current,
      borderRadius: globalRadius,
    }));
  }

  /** Resets all individual border values. */
  resetIndividualBorders(): void {
    this.border.update((value) => ({
      ...value,
      borderTop: '',
      borderRight: '',
      borderBottom: '',
      borderLeft: '',
    }));
  }

  /** Resets all individual radius values. */
  resetIndividualRadiusBorders(): void {
    this.border.update((value) => ({
      ...value,
      borderTopLeftRadius: '',
      borderTopRightRadius: '',
      borderBottomRightRadius: '',
      borderBottomLeftRadius: '',
    }));
  }

  /**
   * Updates the background color from the color picker.
   */
  onBackgroundColorChange(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.borderForm.borderColor().value.set(color);
  }
}
