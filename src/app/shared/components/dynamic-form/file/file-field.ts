import { AsyncPipe, NgClass } from '@angular/common';
import { AfterViewInit, Component, inject, input, signal } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  DynamicTextPipe,
  injectNgForgeField,
  NgForgeControl,
  NgForgeFieldHost,
} from '@ng-forge/dynamic-forms/integration';
import { ParameterService } from '@core/services';
import { ImagesManagerComponent } from '@shared/components';
import { findParameter } from '@shared/utils';

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

    <div class="w-full">
      <div
        [class.border-red-500!]="ngf.errorsToDisplay().length > 0"
        [class.border-dashed]="ngf.errorsToDisplay().length === 0"
        class="group w-full rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-indigo-400 hover:shadow-sm"
      >
        <!-- Preview + información -->
        <div class="flex items-center gap-3">
          <!-- Preview -->
          <div class="relative shrink-0">
            <div
              class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition-colors group-hover:border-indigo-200"
            >
              @if (previewUrl() !== null) {
                @if (props()?.type === 'image') {
                  <img class="h-full w-full object-contain" [src]="getImage()" alt="preview" />
                } @else {
                  <i
                    class="fa-lg"
                    [ngClass]="{
                      'fa-solid fa-file-pdf text-red-500': props()?.type === 'pdf',
                      'fa-solid fa-file-audio text-blue-500': props()?.type === 'audio',
                      'fa-solid fa-file-video text-green-500': props()?.type === 'video',
                      'fa-solid fa-file-lines text-slate-500': props()?.type === 'text',
                      'fa-solid fa-file text-slate-400': props()?.type === 'file',
                    }"
                  ></i>
                }
              } @else {
                <i
                  class="fa-lg transition-colors group-hover:text-indigo-500"
                  [ngClass]="{
                    'fa-regular fa-camera text-indigo-500': props()?.type === 'image',
                    'fa-solid fa-file-pdf text-red-500': props()?.type === 'pdf',
                    'fa-solid fa-file-audio text-blue-500': props()?.type === 'audio',
                    'fa-solid fa-file-video text-green-500': props()?.type === 'video',
                    'fa-solid fa-file-lines text-slate-500': props()?.type === 'text',
                    'fa-solid fa-file text-slate-400': props()?.type === 'file',
                  }"
                ></i>
              }
            </div>

            <!-- Add badge -->
            <div
              class="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm"
            >
              <i class="fa-solid fa-plus fa-2xs"></i>
            </div>
          </div>

          <!-- Label -->
          <div class="min-w-0 flex-1">
            <div class="flex items-start">
              <p
                [class.text-red-500!]="ngf.errorsToDisplay().length > 0"
                class="truncate text-sm font-semibold text-slate-800"
                [title]="ngf.label() | dynamicText | async"
              >
                {{ ngf.label() | dynamicText | async }}

                @if (props()?.required) {
                  <span class="ml-0.5 text-red-500">*</span>
                }
              </p>
            </div>

            @if (props()?.hint) {
              <p class="mt-0.5 line-clamp-2 text-[11px] leading-4 text-slate-400">
                {{ props()?.hint }}
              </p>
            }
          </div>
        </div>

        <!-- Action -->
        <div class="mt-3 w-full">
          @if (previewUrl() === null) {
            <button
              type="button"
              (click)="toggleFileManager(null)"
              class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <i class="fa-solid fa-cloud-arrow-up text-[11px]"></i>
              <span class="truncate">{{ props()?.placeholder }}</span>
            </button>
          } @else {
            <button
              type="button"
              (click)="clearFile()"
              class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <i class="fa-solid fa-trash-can text-[11px]"></i>
              <span class="truncate">{{ props()?.remove }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Hidden control -->
      <input
        ngForgeControl
        [id]="inputId"
        [formField]="f"
        [type]="'text'"
        [placeholder]="ngf.placeholder ?? ''"
        [attr.aria-invalid]="ngf.errorsToDisplay().length > 0"
        class="hidden"
      />

      <!-- Error -->
      @if (ngf.errorsToDisplay()[0]; as error) {
        <div
          role="alert"
          [id]="ngf.errorId()"
          class="mt-1.5 flex items-start gap-1 text-[11px] leading-4 text-red-500"
        >
          <i class="fa-solid fa-circle-exclamation mt-0.5 text-[10px]"></i>
          <span>{{ error.message }}</span>
        </div>
      }
    </div>

    @if (isOpenFileManager()) {
      <files-manager
        [mimeType]="props()?.type!"
        (onSelectedFileEvent)="toggleFileManager($event)"
      />
    }
  `,
})
export default class TailwindFileFieldComponent implements AfterViewInit {
  protected readonly ngf = injectNgForgeField<string>();

  readonly props = input<FileFieldProps>();

  urlStatics = signal<string>('');
  isOpenFileManager = signal<boolean>(false);
  previewUrl = signal<string | null>(null);

  private _parameterService = inject(ParameterService);

  readonly parameters = this._parameterService.publicParameters;

  /**
   * Constructor
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
