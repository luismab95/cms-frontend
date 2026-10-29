import { Component, computed, effect, inject, input, output } from '@angular/core';
import { EtiquetaPlugin } from '../etiqueta/etiqueta';
import { ImagenPlugin } from '../imagen/imagen';
import { CanvasService } from '@core/services';
import { PluginPropertiesI } from '@shared/interfaces';
import { ElementWrappeComponent } from '@shared/components/element-wrapper/element-wrapper';
import { ReviewCommentI } from '@core/interfaces';

@Component({
  selector: 'boton-plugin',
  templateUrl: './boton.html',
  imports: [EtiquetaPlugin, ImagenPlugin, ElementWrappeComponent],
})
export class BotonPlugin {
  element = input.required<PluginPropertiesI>();
  preview = input.required<boolean>();
  isInReviewMode = input.required<boolean>();
  comments = input.required<ReviewCommentI[]>();
  selectElementEvent = output<string>();

  private readonly _canvasService = inject(CanvasService);
  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

  readonly imageElement = computed(() =>
    this.element().children.find((children) => children.slot === 'image'),
  );
  readonly labelElement = computed(() =>
    this.element().children.find((children) => children.slot === 'title'),
  );

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const element = this.element();
      if (!element) return;
    });
  }

  /**
   * Emit event to select
   * @param uuid
   */
  selectElement(uuid: string) {
    this.selectElementEvent.emit(uuid);
  }

  /**
   * action event
   */
  actionEvent() {
    if (!this.preview()) return;
    window.open(this.element().config['goTo'], this.element().config['target']);
  }
}
