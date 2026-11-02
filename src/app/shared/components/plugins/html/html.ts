import { Component, input, signal, effect, output, inject, computed } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReviewCommentI } from '@core/interfaces';
import { ElementWrappeComponent } from '@shared/components/element-wrapper/element-wrapper';
import { PluginPropertiesI } from '@shared/interfaces';
import { SafeUrl } from '@shared/utils/element.utils';

@Component({
  selector: 'html-plugin',
  templateUrl: './html.html',
  imports: [ElementWrappeComponent],
})
export class HtmlPlugin {
  element = input.required<PluginPropertiesI>();
  preview = input.required<boolean>();
  isInReviewMode = input.required<boolean>();
  comments = input.required<ReviewCommentI[]>();
  selectElementEvent = output<string>();

  htmlContent = signal<string>('');

  private readonly _domSanitizer = inject(DomSanitizer);

  readonly getSafeUrl = SafeUrl;
  readonly safeUrlIframe = computed(() =>
    this._domSanitizer.bypassSecurityTrustHtml(this.htmlContent()),
  );

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const element = this.element();
      if (!element) return;
      const htmlContent = String(element.config['html']);
      this.htmlContent.set(htmlContent ?? '');
    });
  }

  /**
   * Emit event to select
   * @param uuid
   */
  selectElement(uuid: string) {
    this.selectElementEvent.emit(uuid);
  }
}
