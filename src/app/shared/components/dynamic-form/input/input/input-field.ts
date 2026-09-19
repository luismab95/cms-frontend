// tailwind-input-field.component.ts
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormField } from '@angular/forms/signals';
import {
  DynamicTextPipe,
  injectNgForgeField,
  NgForgeControl,
  NgForgeFieldHost,
} from '@ng-forge/dynamic-forms/integration';

export interface InputProps extends Record<string, unknown> {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
}

@Component({
  selector: 'input-field',
  imports: [FormField, DynamicTextPipe, AsyncPipe, NgForgeControl],
  hostDirectives: [NgForgeFieldHost],
  template: `
    @let f = ngf.field();
    @let inputId = ngf.key() + '-input';

    <div class="flex items-start justify-between flex-col w-full! gap-1">
      @if (ngf.label()) {
        <label
          [class.text-red-500!]="ngf.errorsToDisplay().length > 0"
          [for]="inputId"
          class="text-[11px] text-slate-600"
        >
          {{ ngf.label() | dynamicText | async }}

          @if (props()?.required) {
            <span class="ml-1 text-red-500">*</span>
          }
        </label>
      }

      <input
        ngForgeControl
        [id]="inputId"
        [formField]="f"
        [type]="props()?.type ?? 'text'"
        [placeholder]="props()?.placeholder ?? ''"
        [attr.aria-invalid]="ngf.errorsToDisplay().length > 0"
        class="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 aria-invalid:border-red-500 aria-invalid:focus:border-red-500 aria-invalid:placeholder:text-red-500"
      />

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
export default class InputFieldComponent {
  protected readonly ngf = injectNgForgeField<string>();

  readonly props = input<InputProps>();
}
