import { Component, inject, input, output } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { CanvasService } from '@core/services';
import { PluginPropertiesI } from '@shared/interfaces';
import { TooltipDirective } from '@shared/directives';

@Component({
  selector: 'element-wrapper-component',
  templateUrl: './element-wrapper.html',
  imports: [NgClass, NgTemplateOutlet, TooltipDirective],
})
export class ElementWrappeComponent {
  element = input.required<PluginPropertiesI>();
  preview = input.required<boolean>();
  isInReviewMode = input.required<boolean>();
  selectElementEvent = output<string>();

  private readonly _canvasService = inject(CanvasService);
  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

  /**
   * Constructor
   */
  constructor() {}

  /**
   * Has commnent
   * @param uuid
   * @returns
   */
  hasComment(uuid: string) {
    return false;
  }

  /**
   * Find if item in canvas has comment
   * @param uuid
   * @returns
   */
  findComment(uuid: string): string {
    return '';
  }

  /**
   * Emit event to select
   */
  selectElement() {
    this.selectElementEvent.emit(this.element().uuid);
  }
}
