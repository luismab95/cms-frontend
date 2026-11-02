import { Component, input, signal, effect, output, inject, computed } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ReviewCommentI } from '@core/interfaces';
import { ElementWrappeComponent } from '@shared/components/element-wrapper/element-wrapper';
import { PluginPropertiesI } from '@shared/interfaces';
import { SafeUrl } from '@shared/utils/element.utils';

@Component({
  selector: 'iframe-plugin',
  templateUrl: './iframe.html',
  imports: [ElementWrappeComponent],
})
export class IframePlugin {
  element = input.required<PluginPropertiesI>();
  preview = input.required<boolean>();
  isInReviewMode = input.required<boolean>();
  comments = input.required<ReviewCommentI[]>();
  selectElementEvent = output<string>();

  reload = signal<boolean>(false);
  src = signal<string>('');

  private readonly _domSanitizer = inject(DomSanitizer);

  readonly getSafeUrl = SafeUrl;
  readonly safeUrlIframe = computed(() =>
    this._domSanitizer.bypassSecurityTrustResourceUrl(this.src()),
  );

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const element = this.element();
      if (!element) return;
      const iframePath = String(element.config['src']);
      const iframeUrl = this.getSafeUrl(iframePath, element.urlStatics);
      if (iframeUrl !== this.src()) this.reload.set(true);
      this.src.set(iframeUrl ?? '');
      setTimeout(() => {
        this.reload.set(false);
      });
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
