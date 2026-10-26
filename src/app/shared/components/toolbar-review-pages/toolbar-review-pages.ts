import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
  NgSelectComponent,
} from '@ng-select/ng-select';
import { PreviewModeT, TypeReviewT } from '@core/interfaces';
import { TooltipDirective } from '@shared/directives';
import { LanguageService } from '@shared/services';

@Component({
  selector: 'toolbar-review-pages-component',
  templateUrl: './toolbar-review-pages.html',
  imports: [
    NgClass,
    TooltipDirective,
    FormsModule,
    UpperCasePipe,
    NgLabelTemplateDirective,
    NgOptionTemplateDirective,
    NgSelectComponent,
  ],
})
export class ToolbarReviewPagesComponent {
  private readonly languageSelect = viewChild.required<NgSelectComponent>('languageSelect');

  urlStatics = input.required<string>();
  name = input.required<string>();
  saveAction = input.required<boolean>();
  reviewType = input.required<TypeReviewT>();
  preview = input.required<PreviewModeT>();
  goBackEvent = output<void>();
  togglePreviewModeEvent = output<PreviewModeT>();
  toggleCompareChangeEvent = output<boolean>();
  setLanguageIdEvent = output<number>();
  cancelEvent = output<void>();
  confirmReviewPageEvent = output<void>();

  languageId = signal<number>(0);
  currentContentPage = signal<boolean>(false);

  private readonly _languageService = inject(LanguageService);

  readonly languages = this._languageService.languages;

  readonly activeLanguages = computed(() => this.languages().records.filter((lang) => lang.status));

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const languages = this.activeLanguages();
      if (this.languageId() === 0 && languages.length > 0) {
        this.setLanguageId(languages[0].id!);
      }
    });
  }

  /**
   * Go to back event
   */
  goToBack() {
    this.goBackEvent.emit();
  }

  /**
   * Change preview mode
   */
  togglePreviewMode(previewMode: PreviewModeT) {
    this.togglePreviewModeEvent.emit(previewMode);
  }

  /**
   * Open language select
   * @param event
   */
  openLanguageSelect(event: MouseEvent): void {
    event.stopPropagation();
    this.languageSelect().open();
  }

  /**
   * Set language
   * @param id
   */
  setLanguageId(id: number) {
    this.languageId.set(id);
    this.setLanguageIdEvent.emit(id);
  }

  /**
   * Cancel changes event
   */
  cancel() {
    this.cancelEvent.emit();
  }

  /**
   * Confirm save review page event
   */
  confirmReviewPage() {
    this.confirmReviewPageEvent.emit();
  }

  /**
   * Compara diferences in page
   */
  toggleChanges() {
    this.currentContentPage.update((prev) => !prev);
    this.toggleCompareChangeEvent.emit(this.currentContentPage());
  }
}
