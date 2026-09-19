import { AsyncPipe, NgClass } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormField } from '@angular/forms/signals';
import {
  DynamicTextPipe,
  injectNgForgeField,
  NgForgeControl,
  NgForgeFieldHost,
} from '@ng-forge/dynamic-forms/integration';
import { ParameterService } from 'app/core/services/parameter.service';
import { ImagesManagerComponent } from '../../files-manager/files-manager';
import { findParameter } from 'app/shared/utils/parameter.utils';

interface FileFieldProps extends Record<string, unknown> {
  accept?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  remove?: string;
  type?: 'image' | 'pdf' | 'audio' | 'video' | 'text' | 'file';
}

@Component({
  selector: 'file-field',
  imports: [FormField, NgForgeControl, NgClass, DynamicTextPipe, AsyncPipe, ImagesManagerComponent],
  hostDirectives: [NgForgeFieldHost],
  template: `
    @let f = ngf.field();
    @let inputId = ngf.key() + '-input';

    <div class="flex items-start justify-between flex-col w-full! gap-1">
      <div>
        <div
          [class.border-red-500!]="ngf.errorsToDisplay().length > 0"
          [class.border-dashed]="ngf.errorsToDisplay().length === 0"
          class="bg-[#fcfdff] p-4 rounded-xl border border-slate-300 hover:border-indigo-500 transition-colors group"
        >
          <div class="flex items-center space-x-4">
            <!-- Circular Avatar Preview with subtle camera overlay -->
            <div class="relative shrink-0">
              <div
                class="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-400 shadow-inner group-hover:border-brand-300 transition-all overflow-hidden"
              >
                @if (previewUrl() !== null) {
                  @if (props()?.type === 'image') {
                    <img class="w-full h-full object-cover" [src]="getImage()" [alt]="'preview'" />
                  } @else {
                    <i
                      class="fa-xl group-hover:text-indigo-600 transition-colors"
                      [ngClass]="{
                        'fa-solid fa-file-pdf text-red-600': props()?.type === 'pdf',
                        'fa-solid fa-file-audio text-blue-600': props()?.type === 'audio',
                        'fa-solid fa-file-video text-green-600': props()?.type === 'video',
                        'fa-solid fa-file-lines text-gray-600': props()?.type === 'text',
                        'fa-solid fa-file text-gray-500': props()?.type === 'file',
                      }"
                    ></i>
                  }
                } @else {
                  <i
                    class="fa-xl group-hover:text-indigo-600 transition-colors"
                    [ngClass]="{
                      'fa-regular fa-camera text-indigo-600': props()?.type === 'image',
                      'fa-solid fa-file-pdf text-red-600': props()?.type === 'pdf',
                      'fa-solid fa-file-audio text-blue-600': props()?.type === 'audio',
                      'fa-solid fa-file-video text-green-600': props()?.type === 'video',
                      'fa-solid fa-file-lines text-gray-600': props()?.type === 'text',
                      'fa-solid fa-file text-gray-500': props()?.type === 'file',
                    }"
                  ></i>
                }
              </div>
              <!-- Badge plus indicator -->
              <div
                class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow"
              >
                <i class="fa-solid fa-plus fa-2xs"></i>
              </div>
            </div>
            <!-- Upload Actions and Specs -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p
                  [class.text-red-500!]="ngf.errorsToDisplay().length > 0"
                  class="text-sm font-semibold text-slate-800"
                >
                  {{ ngf.label() | dynamicText | async }}
                  @if (props()?.required) {
                    <span class="ml-1 text-red-500">*</span>
                  }
                </p>
              </div>
              <p class="text-xs text-slate-400 mt-0.5">{{ props()?.hint }}</p>
              <div class="mt-2.5 flex items-center space-x-2">
                @if (previewUrl() === null) {
                  <label
                    (click)="toggleFileManager(null)"
                    class="cursor-pointer inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <span>{{ props()?.placeholder }}</span>
                  </label>
                } @else {
                  <label
                    (click)="clearFile()"
                    class="cursor-pointer inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <span>{{ props()?.remove }}</span>
                  </label>
                }
              </div>
            </div>
          </div>
        </div>

        <input
          ngForgeControl
          [id]="inputId"
          [formField]="f"
          [type]="'text'"
          [placeholder]="ngf.placeholder ?? ''"
          [attr.aria-invalid]="ngf.errorsToDisplay().length > 0"
          class="hidden"
        />

        <!-- Errores -->
        @if (ngf.errorsToDisplay()[0]; as error) {
          <div role="alert" [id]="ngf.errorId()" class="text-xs text-red-500">
            {{ error.message }}
          </div>
        }
      </div>
    </div>

    @if (isOpenFileManager()) {
      <files-manager
        [mimeType]="props()?.type!"
        (onSelectedFileEvent)="toggleFileManager($event)"
      />
    }
  `,

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TailwindFileFieldComponent implements AfterViewInit {
  protected readonly ngf = injectNgForgeField<string>();

  readonly props = input<FileFieldProps>();

  urlStatics = signal<string>('');
  isOpenFileManager = signal<boolean>(false);
  previewUrl = signal<string | null>(null);

  private _parameterService = inject(ParameterService);

  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });

  /**
   *
   */
  constructor() {
    this.urlStatics.set(findParameter('APP_STATICS_URL', this.parameters())?.value!);
  }

  /**
   * AfterViewInit
   */
  ngAfterViewInit(): void {
    const value = this.getFieldValue();
    if (value() !== '' && value() !== undefined && value() !== 'null') this.previewUrl.set(value());
  }

  /**
   * Get image
   */
  getImage() {
    return `${this.urlStatics()}/${this.previewUrl()}`;
  }

  /**
   * Open file manager
   */
  toggleFileManager(path: string | null) {    
    if (path !== null) {
      this.previewUrl.set(path);
      this.setFieldValue(path);
    }

    this.isOpenFileManager.update((prev) => !prev);
  }

  /**
   * Clear file
   */
  clearFile() {
    this.previewUrl.set(null);
    this.setFieldValue('null');
    this.toggleFileManager(null);
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
