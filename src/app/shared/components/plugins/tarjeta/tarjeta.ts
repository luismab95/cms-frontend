import { Component, computed, effect, inject, input, output } from '@angular/core';
import { EtiquetaPlugin } from '../etiqueta/etiqueta';
import { ImagenPlugin } from '../imagen/imagen';
import { CanvasService } from '@core/services';
import { BotonPlugin } from '../boton/boton';
import { ParrafoPlugin } from '../parrafo/parrafo';
import { ReviewCommentI } from '@core/interfaces';
import { PluginPropertiesI } from '@shared/interfaces';
import { ElementWrappeComponent } from '@shared/components/element-wrapper/element-wrapper';

@Component({
  selector: 'tarjeta-plugin',
  templateUrl: './tarjeta.html',
  imports: [EtiquetaPlugin, ImagenPlugin, BotonPlugin, ParrafoPlugin, ElementWrappeComponent],
})
export class TarjetaPlugin {
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
  readonly titleElement = computed(() =>
    this.element().children.find((children) => children.slot === 'title'),
  );
  readonly descriptionElement = computed(() =>
    this.element().children.find((children) => children.slot === 'description'),
  );
  readonly buttonElement = computed(() =>
    this.element().children.find((children) => children.slot === 'button'),
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
}
