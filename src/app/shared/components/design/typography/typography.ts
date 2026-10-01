import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField } from '@angular/forms/signals';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import {
  FontFamilyOptionI,
  TextAlignT,
  TextOverflowT,
  TypographyStylesI,
  WhiteSpaceT,
  WordBreakT,
} from 'app/shared/interfaces/design.interface';
import { FONT_FAMILIES } from 'app/shared/utils/design.utils';
import { defaultTypographyStyles } from 'app/shared/utils/grid.utils';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'design-typography-component',
  imports: [FormField, TooltipDirective],
  template: `
    <details class="group/sec">
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-font"></i>
          <span>Tipografía</span>
        </div>
        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>
      <div class="p-3.5 space-y-3 bg-white">
        <!-- Font Family -->
        <div>
          <label class="text-[10px] text-slate-500 font-medium block mb-0.5"
            >font-family</label
          >
          <div class="flex items-center bg-white">
            <select
              [formField]="typographyForm.fontFamily"
              class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              @for (group of fontGroups; track group.category) {
                <optgroup [label]="group.label">
                  @for (font of group.fonts; track font.value) {
                    <option [value]="font.value">
                      {{ font.label }}
                    </option>
                  }
                </optgroup>
              }
            </select>
          </div>
        </div>
        <!-- Font Size & Font Weight -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">font-size</label>
            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="typographyForm.fontSize"
            />
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">font-weight</label>
            <select
              [formField]="typographyForm.fontWeight"
              class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              <option [value]="300">300 (NormaL)</option>
              <option [value]="400">400 (Regular)</option>
              <option [value]="500">500 (Medium)</option>
              <option [value]="600">600 (Semibold)</option>
              <option [value]="700">700 (Bold)</option>
            </select>
          </div>
        </div>
        <!-- Line Height & Letter Spacing -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">line-height</label>
            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="typographyForm.lineHeight"
            />
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"
              >letter-spacing</label
            >
            <input
              class="w-full border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700  focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
              [formField]="typographyForm.letterSpacing"
            />
          </div>
        </div>
        <!-- Color & Text Align -->
        <div class="grid grid-cols-1 gap-2">
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> color </label>

              <span
                [style.color]="typography().color === '' ? 'transparent' : typography().color"
                class="text-[10px] font-bold"
              >
                '{{ typography().color }}'
              </span>
            </div>

            <div
              class="flex items-center gap-1.5 border border-slate-200 rounded px-2 py-0.5 bg-white"
            >
              <input
                type="color"
                [value]="typography().color || '#ffffff'"
                (input)="onBackgroundColorChange($event)"
                class="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
              />

              <input
                class="cursor-pointer w-full border-0 p-0 text-xs text-slate-700 uppercase focus:ring-0 focus:outline-none"
                type="text"
                [formField]="typographyForm.color"
                placeholder="#000000"
              />
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5">text-align</label>
              <span class="text-[10px] text-indigo-600 font-bold">
                '{{ typography().textAlign }}'
              </span>
            </div>
            <div class="grid grid-cols-4 gap-0.5 bg-slate-100 p-0.5 rounded text-center">
              @for (value of textAligns; track value) {
                <button
                  (click)="typographyForm.textAlign().value.set(value)"
                  [class.bg-white!]="typography().textAlign === value"
                  [class.text-indigo-700!]="typography().textAlign === value"
                  [class.shadow-xs!]="typography().textAlign === value"
                  [class.font-bold!]="typography().textAlign === value"
                  class="cursor-pointer p-1 text-slate-500 hover:bg-white rounded"
                  [appTooltip]="value"
                >
                  @switch (value) {
                    @case ('left') {
                      <i class="w-3 h-3 mx-auto fa-solid fa-align-left"></i>
                    }
                    @case ('center') {
                      <i class="w-3 h-3 mx-auto fa-solid fa-align-center"></i>
                    }
                    @case ('right') {
                      <i class="w-3 h-3 mx-auto fa-solid fa-align-right"></i>
                    }
                    @case ('justify') {
                      <i class="w-3 h-3 mx-auto fa-solid fa-align-justify"></i>
                    }
                  }
                </button>
              }
            </div>
          </div>
        </div>
        <!-- Text Transform & Text Decoration & Font Style & White Space, Word Break, Text Overflow -->
        <div class="grid grid-cols-2 gap-1.5">
          <div>
            <label class="text-[9px] text-slate-500 font-medium block mb-0.5">text-transform</label>
            <select
              [formField]="typographyForm.textTransform"
              class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              <option selected="">uppercase</option>
              <option>none</option>
              <option>capitalize</option>
              <option>lowercase</option>
            </select>
          </div>
          <div>
            <label class="text-[9px] text-slate-500 font-medium block mb-0.5">decoration</label>
            <select
              [formField]="typographyForm.textDecoration"
              class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              <option selected="">none</option>
              <option>underline</option>
              <option>line-through</option>
            </select>
          </div>
          <div>
            <label class="text-[9px] text-slate-500 font-medium block mb-0.5">font-style</label>
            <select
              [formField]="typographyForm.fontStyle"
              class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
            >
              <option selected="">normal</option>
              <option>italic</option>
            </select>
          </div>

          <div>
            <div>
              <label class="text-[9px] text-slate-500 font-medium block mb-0.5">white-space</label>
              <select
                [formField]="typographyForm.whiteSpace"
                class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
              >
                @for (value of whiteSpaces; track value) {
                  <option [value]="value">{{ value }}</option>
                }
              </select>
            </div>
          </div>
          <div>
            <div>
              <label class="text-[9px] text-slate-500 font-medium block mb-0.5">word-break</label>
              <select
                [formField]="typographyForm.wordBreak"
                class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
              >
                @for (value of wordBreaks; track value) {
                  <option [value]="value">{{ value }}</option>
                }
              </select>
            </div>
          </div>
          <div>
            <div>
              <label class="text-[9px] text-slate-500 font-medium block mb-0.5"
                >text-overflow</label
              >
              <select
                [formField]="typographyForm.textOverflow"
                class="w-full border border-slate-200 rounded py-0.5 px-2 text-xs text-slate-700 bg-white focus:ring-0 focus:outline-none focus:shadow-xs"
              >
                @for (value of textOverflows; track value) {
                  <option [value]="value">{{ value }}</option>
                }
              </select>
            </div>
          </div>
        </div>
      </div>
    </details>
  `,
})
export class DesignTypographyComponent {
  value = input.required<TypographyStylesI>();
  updateValues = output<Record<string, string>>();

  readonly textAligns: TextAlignT[] = ['left', 'center', 'right', 'justify'];
  readonly whiteSpaces: WhiteSpaceT[] = ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'];
  readonly wordBreaks: WordBreakT[] = ['normal', 'break-all', 'break-word'];
  readonly textOverflows: TextOverflowT[] = ['clip', 'ellipsis'];
  readonly fontGroups = [
    {
      label: 'Sans Serif',
      category: 'sans-serif' as const,
    },
    {
      label: 'Serif',
      category: 'serif' as const,
    },
    {
      label: 'Monospace',
      category: 'monospace' as const,
    },
    {
      label: 'Display',
      category: 'display' as const,
    },
    {
      label: 'Cursive',
      category: 'cursive' as const,
    },
  ].map((group) => ({
    ...group,
    fonts: FONT_FAMILIES.filter((font) => font.category === group.category),
  }));

  typography = signal<Required<TypographyStylesI>>(defaultTypographyStyles);

  typographyForm = form(this.typography);

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
      this.typography.update((current) => ({
        ...current,
        ...value,
      }));

      queueMicrotask(() => {
        this.isInitializing = false;
      });
    });

    toObservable(this.typography)
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
    this.typographyForm.color().value.set(color);
  }
}
