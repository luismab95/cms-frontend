import { Component, input, output } from '@angular/core';
import { ReviewCommentI } from '@core/interfaces';
import { ElementWrappeComponent } from '@shared/components/element-wrapper/element-wrapper';
import { PluginPropertiesI } from '@shared/interfaces';

@Component({
  selector: 'parrafo-plugin',
  templateUrl: './parrafo.html',
  imports: [ElementWrappeComponent],
})
export class ParrafoPlugin {
  element = input.required<PluginPropertiesI>();
  preview = input.required<boolean>();
  isInReviewMode = input.required<boolean>();
  comments = input.required<ReviewCommentI[]>();
  selectElementEvent = output<string>();

  /**
   * Emit event to select
   * @param uuid
   */
  selectElement(uuid: string) {
    this.selectElementEvent.emit(uuid);
  }
}
