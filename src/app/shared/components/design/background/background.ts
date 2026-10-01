import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  BackgroundAttachmentT,
  BackgroundClipT,
  BackgroundPositionT,
  BackgroundRepeatT,
  BackgroundSizeT,
  BackgroundStylesI,
} from 'app/shared/interfaces/design.interface';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { defaultBackgroundStyles } from 'app/shared/utils/grid.utils';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'design-background-component',
  imports: [FormField, TooltipDirective],
  template: `
    <details class="group/sec">
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-fill-drip"></i>
          <span
            >Fondo
            <i
              appTooltip="La imagen de fondo se puede configurar en la pestaña de propiedades."
              class="fa-solid fa-circle-info text-indigo-600"
            ></i>
          </span>
        </div>
        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>
      <div class="p-3.5 space-y-3 bg-white">
        <!-- Background Color  -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> color </label>

            <span
              [style.color]="
                background().backgroundColor === '' ? 'transparent' : background().backgroundColor
              "
              class="text-[10px] font-bold"
            >
              '{{ background().backgroundColor }}'
            </span>
          </div>

          <div
            class="flex items-center gap-1.5 border border-slate-200 rounded px-2 py-0.5 bg-white"
          >
            <input
              type="color"
              [value]="background().backgroundColor || '#ffffff'"
              (input)="onBackgroundColorChange($event)"
              class="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
            />

            <input
              class="cursor-pointer w-full border-0 p-0 text-xs text-slate-700 uppercase focus:ring-0 focus:outline-none"
              type="text"
              [formField]="backgroundForm.backgroundColor"
              placeholder="#000000"
            />
          </div>
        </div>
        <!-- Background Repeat & Clip -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"
              >background-repeat</label
            >
            <select
              [formField]="backgroundForm.backgroundRepeat"
              class="w-full border border-slate-200 rounded py-0.5 px-1.5 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              @for (value of backgroundRepeats; track value) {
                <option [value]="value">{{ value === '' ? 'Ninguno' : value }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">clip</label>
            <select
              [formField]="backgroundForm.backgroundClip"
              class="w-full border border-slate-200 rounded py-0.5 px-1.5 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              @for (value of backgroundClips; track value) {
                <option [value]="value">{{ value === '' ? 'Ninguno' : value }}</option>
              }
            </select>
          </div>
        </div>
        <!-- Size, Position & Attachment -->
        <div class="grid grid-cols-3 gap-1.5 text-[10px]">
          <div>
            <label class="text-slate-500 block mb-0.5">size</label>
            <select
              [formField]="backgroundForm.backgroundSize"
              class="w-full border border-slate-200 rounded py-0.5 px-1.5 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              @for (value of backgroundSizes; track value) {
                <option [value]="value">{{ value === '' ? 'Ninguno' : value }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-slate-500 block mb-0.5">position</label>
            <select
              [formField]="backgroundForm.backgroundPosition"
              class="w-full border border-slate-200 rounded py-0.5 px-1.5 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none"
            >
              @for (value of backgroundPositions; track value) {
                <option [value]="value">{{ value === '' ? 'Ninguno' : value }}</option>
              }
            </select>
          </div>
          <div>
            <label class="text-slate-500 block mb-0.5">attachment</label>
            <select
              [formField]="backgroundForm.backgroundAttachment"
              class="w-full border border-slate-200 rounded py-0.5 px-1.5 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              @for (value of backgroundAttachments; track value) {
                <option [value]="value">{{ value === '' ? 'Ninguno' : value }}</option>
              }
            </select>
          </div>
        </div>
      </div>
    </details>
  `,
})
export class DesignBackgroundComponent {
  value = input.required<BackgroundStylesI>();
  updateValues = output<Record<string, string>>();

  background = signal<Required<BackgroundStylesI>>(defaultBackgroundStyles);

  backgroundForm = form(this.background);

  readonly backgroundSizes: BackgroundSizeT[] = ['auto', 'cover', 'contain', ''];
  readonly backgroundPositions: BackgroundPositionT[] = [
    'left',
    'center',
    'right',
    'top',
    'bottom',
    '',
  ];
  readonly backgroundRepeats: BackgroundRepeatT[] = [
    'repeat',
    'repeat-x',
    'repeat-y',
    'no-repeat',
    '',
  ];
  readonly backgroundAttachments: BackgroundAttachmentT[] = ['scroll', 'fixed', 'local', ''];
  readonly backgroundClips: BackgroundClipT[] = ['border-box', 'padding-box', 'content-box', ''];

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
      this.background.update((current) => ({ ...current, ...value }));

      queueMicrotask(() => {
        this.isInitializing = false;
      });
    });

    toObservable(this.background)
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

  /**
   * Updates the background color from the color picker.
   */
  onBackgroundColorChange(event: Event): void {
    const color = (event.target as HTMLInputElement).value;
    this.backgroundForm.backgroundColor().value.set(color);
  }
}
