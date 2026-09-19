import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import {
  DynamicTextPipe,
  injectNgForgeField,
  NgForgeControl,
  NgForgeFieldHost,
} from '@ng-forge/dynamic-forms/integration';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends Record<string, unknown> {
  placeholder?: string;
  hint?: string;
  required?: boolean;
  label?: string;
}

@Component({
  selector: 'select-field',
  imports: [FormField, DynamicTextPipe, AsyncPipe, NgForgeControl],
  hostDirectives: [NgForgeFieldHost],
  template: `
    @let f = ngf.field();
    @let selectId = ngf.key() + '-select';

    <div class="flex items-start justify-between flex-col w-full! gap-1">
      @if (ngf.label()) {
        <label
          [class.text-red-500!]="ngf.errorsToDisplay().length > 0"
          [for]="selectId"
          class="text-[11px] text-slate-600"
        >
          {{ ngf.label() | dynamicText | async }}

          @if (props()?.required) {
            <span class="ml-1 text-red-500">*</span>
          }
        </label>
      }

      <select
        ngForgeControl
        [id]="selectId"
        [formField]="f"
        [attr.aria-invalid]="ngf.errorsToDisplay().length > 0"
        class="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 aria-invalid:border-red-500 aria-invalid:focus:border-red-500 aria-invalid:placeholder:text-red-500"
      >
        @if (props()?.placeholder) {
          <option value="" disabled>
            {{ props()?.placeholder }}
          </option>
        }

        @for (option of options(); track option.value) {
          <option [value]="option.value">
            {{ option.label }}
          </option>
        }
      </select>

      @if (ngf.errorsToDisplay()[0]; as error) {
        <div role="alert" [id]="ngf.errorId()" class="text-xs text-red-500">
          {{ error.message }}
        </div>
      } @else if (props()?.hint; as hint) {
        <div [id]="ngf.hintId()" class="text-xs text-slate-500">
          {{ hint }}
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SelectFieldComponent {
  protected readonly ngf = injectNgForgeField<string>();

  readonly props = input<SelectProps>();

  /**
   * optionsFieldMapper asigna directamente
   * esta propiedad.
   */
  readonly options = input<SelectOption[]>([]);
}
