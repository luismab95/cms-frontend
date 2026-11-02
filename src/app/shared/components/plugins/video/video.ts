import { Component, input, signal, effect, output } from '@angular/core';
import { ReviewCommentI } from '@core/interfaces';
import { ElementWrappeComponent } from '@shared/components/element-wrapper/element-wrapper';
import { PluginPropertiesI } from '@shared/interfaces';
import { SafeUrl } from '@shared/utils';

@Component({
  selector: 'video-plugin',
  templateUrl: './video.html',
  imports: [ElementWrappeComponent],
})
export class VideoPlugin {
  element = input.required<PluginPropertiesI>();
  preview = input.required<boolean>();
  isInReviewMode = input.required<boolean>();
  comments = input.required<ReviewCommentI[]>();
  selectElementEvent = output<string>();

  reload = signal<boolean>(false);
  type = signal<string>('');
  src = signal<string>('');
  poster = signal<string>('');

  readonly getSafeUrl = SafeUrl;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const element = this.element();
      if (!element) return;
      const videoPath = String(element.config['video']);
      const videoUrl = this.getSafeUrl(videoPath, element.urlStatics);
      if (videoUrl !== this.src()) this.reload.set(true);
      this.src.set(videoUrl ?? '');

      const ext = videoUrl.split('/').pop()?.split('.').pop();
      this.type.set('video/' + ext);

      const posterPath = String(element.config['poster']);
      const posterUrl = this.getSafeUrl(posterPath, element.urlStatics);
      this.poster.set(posterUrl ?? '');

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
