import { Component, computed, effect, input, output, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  DisplayT,
  FlexDirectionT,
  FlexWrapT,
  JustifyContentT,
  AlignItemsT,
  AlignContentT,
  AlignSelfT,
  LayoutStylesI,
} from 'app/shared/interfaces/design.interface';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';

@Component({
  selector: 'design-layout-component',
  imports: [FormField, TooltipDirective],
  template: `
    <details class="group/sec" open>
      <summary
        class="px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer select-none"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 text-[11px] uppercase tracking-wide"
        >
          <i class="w-3.5 h-3.5 text-indigo-600 fa-solid fa-table-columns"></i>
          <span>1. Disposición & Flexbox</span>
        </div>
        <i
          class="w-3.5 h-3.5 text-slate-400 group-open/sec:rotate-180 transition-transform fa-solid fa-chevron-down"
        ></i>
      </summary>

      <div class="p-3.5 space-y-3 bg-white pb-6">
        <!-- DISPLAY -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <span class="text-[10px] text-slate-500 font-medium"> display </span>

            <span class="text-[10px] text-indigo-600 font-bold"> '{{ layout().display }}' </span>
          </div>
          <div class="grid grid-cols-5 gap-1 bg-slate-100 p-0.5 rounded-lg text-center text-[10px]">
            @for (display of displays; track display) {
              <button
                type="button"
                (click)="setDisplay(display)"
                [class.bg-white!]="layoutForm.display().value() === display"
                [class.text-indigo-700!]="layoutForm.display().value() === display"
                [class.font-bold!]="layoutForm.display().value() === display"
                [class.shadow-xs!]="layoutForm.display().value() === display"
                class="cursor-pointer py-1 rounded hover:bg-white text-slate-600"
              >
                {{ display }}
              </button>
            }
          </div>
        </div>
        <!-- WIDTH / HEIGHT -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> width </label>
            <input
              [formField]="layoutForm.width"
              class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
            />
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> height </label>
            <input
              [formField]="layoutForm.height"
              class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
              type="text"
            />
          </div>
        </div>
        <!-- MIN / MAX -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">
              min-width / max-width
            </label>
            <div class="grid grid-cols-2 gap-1">
              <input
                [formField]="layoutForm.minWidth"
                class="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
              />
              <input
                [formField]="layoutForm.maxWidth"
                class="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
              />
            </div>
          </div>
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5">
              min-height / max-height
            </label>
            <div class="grid grid-cols-2 gap-1">
              <input
                [formField]="layoutForm.minHeight"
                class="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
              />
              <input
                [formField]="layoutForm.maxHeight"
                class="border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:ring-0 focus:outline-none focus:shadow-xs"
                type="text"
              />
            </div>
          </div>
        </div>
        <!-- BOX SIZING -->
        <div class="grid grid-cols-1 gap-2 pt-1">
          <div>
            <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> box-sizing </label>
            <select
              [formField]="layoutForm.boxSizing"
              class="w-full border border-slate-200 rounded py-1 px-1.5 text-xs text-slate-700 bg-white focus:shadow-xs"
            >
              <option value="border-box">border-box</option>
              <option value="content-box">content-box</option>
            </select>
          </div>
        </div>
        @if (isFlex()) {
          <div class="grid grid-cols-1 gap-2">
            <!-- FLEX WRAP -->
            <div>
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> flex-wrap </label>
              <select
                [formField]="layoutForm.flexWrap"
                class="w-full border border-slate-200 rounded py-1 px-1.5 text-xs text-slate-700 bg-white focus:shadow-xs"
              >
                @for (wrap of flexWraps; track wrap) {
                  <option [value]="wrap">
                    {{ wrap }}
                  </option>
                }
              </select>
            </div>
            <!-- FLEX DIRECTION -->
            <div>
              <div class="flex justify-between items-center mb-0.5">
                <label class="text-[10px] text-slate-500 font-medium block mb-0.5">
                  flex-direction
                </label>
                <span class="text-[9px] text-indigo-600 font-bold">
                  {{ layout().flexDirection }}
                </span>
              </div>
              <div class="grid grid-cols-4 gap-0.5 bg-slate-100 p-0.5 rounded text-center">
                @for (flexDirection of flexDirections; track flexDirection) {
                  <button
                    type="button"
                    (click)="layoutForm.flexDirection().value.set(flexDirection)"
                    [class.bg-white!]="layoutForm.flexDirection().value() === flexDirection"
                    [class.text-indigo-700!]="layoutForm.flexDirection().value() === flexDirection"
                    [class.font-bold!]="layoutForm.flexDirection().value() === flexDirection"
                    [class.shadow-xs!]="layoutForm.flexDirection().value() === flexDirection"
                    class="cursor-pointer p-1 rounded text-slate-600 hover:bg-white"
                    [appTooltip]="flexDirection"
                  >
                    @switch (flexDirection) {
                      @case ('row') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-arrow-right"></i>
                      }

                      @case ('row-reverse') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-arrow-left"></i>
                      }

                      @case ('column') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-arrow-down"></i>
                      }

                      @case ('column-reverse') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-arrow-up"></i>
                      }
                    }
                  </button>
                }
              </div>
            </div>
          </div>
          <!-- JUSTIFY CONTENT -->
          <div class="grid grid-cols-1 gap-2">
            <div>
              <div class="flex justify-between items-center mb-0.5">
                <label class="text-[10px] text-slate-500 font-medium"> justify-content </label>
                <span class="text-[9px] text-indigo-600 font-bold">
                  {{ layout().justifyContent }}
                </span>
              </div>
              <div class="grid grid-cols-6 gap-0.5 bg-slate-100 p-0.5 rounded text-center">
                @for (value of justifyContents; track value) {
                  <button
                    type="button"
                    (click)="layoutForm.justifyContent().value.set(value)"
                    [class.bg-white!]="layoutForm.justifyContent().value() === value"
                    [class.text-indigo-700!]="layoutForm.justifyContent().value() === value"
                    [class.font-bold!]="layoutForm.justifyContent().value() === value"
                    [class.shadow-xs!]="layoutForm.justifyContent().value() === value"
                    class="cursor-pointer p-1 text-slate-500 hover:bg-white rounded"
                    [appTooltip]="value"
                  >
                    @switch (value) {
                      @case ('flex-start') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-align-left"></i>
                      }
                      @case ('center') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-align-center"></i>
                      }
                      @case ('flex-end') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-align-right"></i>
                      }
                      @case ('space-between') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-arrows-left-right"></i>
                      }
                      @case ('space-around') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-grip-lines-vertical"></i>
                      }
                      @case ('space-evenly') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-grip-lines"></i>
                      }
                    }
                  </button>
                }
              </div>
            </div>

            <!-- ALIGN ITEMS -->
            <div>
              <div class="flex justify-between items-center mb-0.5">
                <label class="text-[10px] text-slate-500 font-medium"> align-items </label>
                <span class="text-[9px] text-indigo-600 font-bold">
                  {{ layout().alignItems }}
                </span>
              </div>
              <div class="grid grid-cols-4 gap-0.5 bg-slate-100 p-0.5 rounded text-center">
                @for (value of alignItems; track value) {
                  <button
                    type="button"
                    (click)="layoutForm.alignItems().value.set(value)"
                    [class.bg-white!]="layoutForm.alignItems().value() === value"
                    [class.text-indigo-700!]="layoutForm.alignItems().value() === value"
                    [class.font-bold!]="layoutForm.alignItems().value() === value"
                    [class.shadow-xs!]="layoutForm.alignItems().value() === value"
                    class="cursor-pointer p-1 text-slate-500 hover:bg-white rounded"
                    [appTooltip]="value"
                  >
                    @switch (value) {
                      @case ('flex-start') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-arrow-up"></i>
                      }
                      @case ('center') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-arrows-up-down"></i>
                      }
                      @case ('flex-end') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-arrow-down"></i>
                      }
                      @case ('stretch') {
                        <i class="w-3 h-3 mx-auto fa-solid fa-arrows-up-down"></i>
                      }
                    }
                  </button>
                }
              </div>
            </div>
          </div>
        }

        <!-- ALIGN CONTENT -->
        @if (canUseAlignContent()) {
          <div>
            <div class="flex justify-between items-center mb-0.5">
              <label class="text-[10px] text-slate-500 font-medium"> align-content </label>
              <span class="text-[9px] text-indigo-600 font-bold">
                {{ layout().alignContent }}
              </span>
            </div>
            <select
              [formField]="layoutForm.alignContent"
              class="w-full border border-slate-200 rounded py-1 px-1.5 text-xs text-slate-700 bg-white focus:shadow-xs focus:ring-0 focus:outline-none"
            >
              @for (value of alignContents; track value) {
                <option [value]="value">
                  {{ value }}
                </option>
              }
            </select>
          </div>
        }
        <!-- ALIGN SELF -->
        @if (isFlexOrGrid()) {
          <div>
            <div class="flex justify-between items-center mb-0.5">
              <label class="text-[10px] text-slate-500 font-medium"> align-self </label>
              <span class="text-[9px] text-indigo-600 font-bold">
                {{ layout().alignSelf }}
              </span>
            </div>
            <select
              [formField]="layoutForm.alignSelf"
              class="w-full border border-slate-200 rounded py-1 px-1.5 text-xs text-slate-700 bg-white focus:shadow-xs focus:ring-0 focus:outline-none"
            >
              @for (value of alignSelfValues; track value) {
                <option [value]="value">
                  {{ value }}
                </option>
              }
            </select>
          </div>
        }

        <!-- GAP -->
        @if (isFlexOrGrid()) {
          <div class="pt-1">
            <div class="flex justify-between items-center mb-1">
              <label class="text-[10px] text-slate-500 font-medium leading-1 tracking-wider">
                gap(general/fila/columna)
              </label>
              <span class="text-[10px] text-indigo-700 font-bold">
                {{ layout().gap }}
              </span>
            </div>

            <div class="grid grid-cols-3 gap-1.5">
              <div class="flex items-center border border-slate-200 rounded px-1.5 py-0.5">
                <span class="text-[9px] text-slate-400 mr-1"> all: </span>
                <input
                  [formField]="layoutForm.gap"
                  class="w-full border-0 p-0 text-xs text-slate-700 focus:shadow-xs focus:ring-0 focus:outline-none"
                  type="text"
                />
              </div>

              <div class="flex items-center border border-slate-200 rounded px-1.5 py-0.5">
                <span class="text-[9px] text-slate-400 mr-1"> row: </span>
                <input
                  [formField]="layoutForm.rowGap"
                  class="w-full border-0 p-0 text-xs text-slate-700 focus:shadow-xs focus:ring-0 focus:outline-none"
                  type="text"
                />
              </div>

              <div class="flex items-center border border-slate-200 rounded px-1.5 py-0.5">
                <span class="text-[9px] text-slate-400 mr-1"> col: </span>
                <input
                  [formField]="layoutForm.columnGap"
                  class="w-full border-0 p-0 text-xs text-slate-700 focus:shadow-xs focus:ring-0 focus:outline-none"
                  type="text"
                />
              </div>
            </div>
          </div>
        }

        <!-- FLEX ITEM -->
        @if (isFlexOrGrid()) {
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> flex-grow </label>
              <input
                [formField]="layoutForm.flexGrow"
                type="number"
                step="1"
                class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:shadow-xs focus:ring-0 focus:outline-none"
              />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5">
                flex-shrink
              </label>
              <input
                [formField]="layoutForm.flexShrink"
                type="number"
                step="1"
                class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5">
                flex-basis
              </label>
              <input
                [formField]="layoutForm.flexBasis"
                type="text"
                class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:shadow-xs focus:ring-0 focus:outline-none"
              />
            </div>
            <div>
              <label class="text-[10px] text-slate-500 font-medium block mb-0.5"> flex </label>
              <input
                [formField]="layoutForm.flex"
                type="text"
                placeholder="0 1 auto"
                class="w-full border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:shadow-xs focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
        }
      </div>
    </details>
  `,
})
export class DesignLayoutComponent {
  value = input.required<LayoutStylesI>();
  updateValues = output<Record<string, string | number>>();

  readonly displays: DisplayT[] = [
    'block',
    'inline',
    // 'inline-block',
    'flex',
    // 'inline-flex',
    'grid',
    // 'inline-grid',
    'none',
  ];
  readonly flexDirections: FlexDirectionT[] = ['row', 'row-reverse', 'column', 'column-reverse'];
  readonly flexWraps: FlexWrapT[] = ['nowrap', 'wrap', 'wrap-reverse'];
  readonly justifyContents: JustifyContentT[] = [
    'flex-start',
    'center',
    'flex-end',
    'space-between',
    'space-around',
    'space-evenly',
  ];
  readonly alignItems: AlignItemsT[] = ['flex-start', 'center', 'flex-end', 'stretch'];
  readonly alignContents: AlignContentT[] = [
    'stretch',
    'flex-start',
    'center',
    'flex-end',
    'space-between',
    'space-around',
    'space-evenly',
  ];
  readonly alignSelfValues: AlignSelfT[] = [
    'auto',
    'flex-start',
    'center',
    'flex-end',
    'stretch',
    'baseline',
  ];

  layout = signal<Required<LayoutStylesI>>({
    display: 'block',
    width: '100%',
    height: '400px',
    minWidth: '',
    maxWidth: '',
    minHeight: '',
    maxHeight: '',
    boxSizing: 'unset',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'normal',
    alignContent: 'normal',
    flexGrow: 0,
    flexShrink: 1,
    flexBasis: '',
    flex: '',
    alignSelf: 'normal',
    gap: '',
    rowGap: '',
    columnGap: '',
  });

  layoutForm = form(this.layout);

  readonly isFlex = computed(() => ['flex', 'inline-flex'].includes(this.layout().display));
  readonly isGrid = computed(() => ['grid', 'inline-grid'].includes(this.layout().display));
  readonly isFlexOrGrid = computed(() => this.isFlex() || this.isGrid());
  readonly canUseAlignContent = computed(() => {
    if (this.isGrid()) {
      return true;
    }

    if (this.isFlex()) {
      return this.layout().flexWrap !== 'nowrap';
    }

    return false;
  });

  private isInitializing = true;

  /**
   *
   */
  constructor() {
    effect(() => {
      const value = this.value();
      if (!value) return;

      this.isInitializing = true;
        this.layout.update((current) => ({
        ...current,
        ...value,
      }));

      queueMicrotask(() => {
        this.isInitializing = false;
      });
    });

    effect(() => {
      const value = this.layout();
      if (this.isInitializing) return;

      this.updateValues.emit(value as unknown as Record<string, string | number>);
    });
  }

  /**
   * set display
   * @param display
   */
  setDisplay(display: DisplayT): void {
    this.layoutForm.display().value.set(display);

    if (!['flex', 'inline-flex'].includes(display)) {
      this.layoutForm.flexDirection().value.set('row');
      this.layoutForm.flexWrap().value.set('nowrap');
      this.layoutForm.justifyContent().value.set('flex-start');
      this.layoutForm.alignItems().value.set('stretch');
      this.layoutForm.alignContent().value.set('stretch');
    }

    if (!['flex', 'inline-flex', 'grid', 'inline-grid'].includes(display)) {
      this.layoutForm.flexGrow().value.set(0);
      this.layoutForm.flexShrink().value.set(1);
      this.layoutForm.flexBasis().value.set('auto');
      this.layoutForm.flex().value.set('0 1 auto');
      this.layoutForm.alignSelf().value.set('auto');
    }
  }

  /**
   * Get short names
   * @param value
   * @returns
   */
  getShortValue(value: string): string {
    const labels: Record<string, string> = {
      stretch: 'stretch',
      'flex-start': 'start',
      'flex-end': 'end',
      center: 'center',
      'space-between': 'between',
      'space-around': 'around',
      'space-evenly': 'evenly',
      normal: 'normal',
    };

    return labels[value] ?? value;
  }
}
