import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import {
  DynamicTextPipe,
  injectNgForgeField,
  NgForgeFieldHost,
} from '@ng-forge/dynamic-forms/integration';
import { EditorComponent } from 'ngx-monaco-editor-v2';

export interface CodeProps extends Record<string, unknown> {
  type: 'html' | 'css' | 'js';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  label?: string;
}

@Component({
  selector: 'code-field',
  imports: [DynamicTextPipe, AsyncPipe, EditorComponent, ReactiveFormsModule],
  hostDirectives: [NgForgeFieldHost],
  template: `
    @let inputId = ngf.key() + '-input';
    <div class="flex items-start justify-between flex-col w-full! gap-1  h-120">
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

      <ngx-monaco-editor
        [id]="inputId"
        style="height: 100%; width: 100%"
        [options]="editorOptions"
        [formControl]="editorControl"
      ></ngx-monaco-editor>

      @if (ngf.errorsToDisplay()[0]; as error) {
        <div role="alert" [id]="ngf.errorId()" class="text-xs text-red-500">
          {{ error.message }}
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class CodeFieldComponent implements AfterViewInit {
  protected readonly ngf = injectNgForgeField<string>();
  readonly props = input<CodeProps>();

  readonly editorOptions = {
    theme: 'vs-dark',
    language: this.props()?.type ?? 'html',
    minimap: { enabled: false },
  };

  editorControl: FormControl = new FormControl();
  private readonly _destroyRef = inject(DestroyRef);

  /**
   * Constructor
   */
  constructor() {
    this.editorControl.valueChanges
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((value) => {
        this.setFieldValue(value);
      });
  }

  /**
   * AfterViewInit
   */
  ngAfterViewInit(): void {
    const value = this.getFieldValue();
    if (value() !== '' && value() !== undefined && value() !== 'null')
      this.editorControl.setValue(value());
  }

  /**
   * Set value
   */
  private setFieldValue(value: string) {
    const field = this.ngf.field();
    const state = field();
    state.value.set(value);
  }

  /**
   * Get Values
   */
  private getFieldValue() {
    const field = this.ngf.field();
    const state = field();
    return state.value;
  }
}
