import { HttpClient } from '@angular/common/http';
import {
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
  computed,
  OnDestroy,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DynamicStyleService, ParameterService, PluginLoaderService } from '@core/services';
import { ElementI, PluginDataI, PluginPropertiesI } from '@shared/interfaces';
import { ElementCode, findParameter } from '@shared/utils';
import {
  EtiquetaPlugin,
  ParrafoPlugin,
  ImagenPlugin,
  BotonPlugin,
  IdiomasPlugin,
  TarjetaPlugin,
} from '@shared/components/plugins';
import { environment } from 'environments/environment';
import { lastValueFrom } from 'rxjs';
import { ReviewCommentI } from '@core/interfaces';

@Component({
  selector: 'elements',
  templateUrl: './elements.html',
  imports: [
    EtiquetaPlugin,
    ParrafoPlugin,
    ImagenPlugin,
    BotonPlugin,
    IdiomasPlugin,
    TarjetaPlugin,
    NgTemplateOutlet,
  ],
})
export class ElementsComponent implements OnDestroy {
  readonly element = input.required<ElementI>();
  readonly languageId = input.required<number>();
  readonly preview = input.required<boolean>();
  readonly isInReviewMode = input.required<boolean>();
  readonly comments = input.required<ReviewCommentI[]>();
  readonly selectElementEvent = output<ElementI>();

  readonly loading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);
  readonly elementRender = signal<PluginPropertiesI | null>(null);
  readonly errorMessage = signal<string>('');

  private readonly _parameterService = inject(ParameterService);
  private readonly _dynamicStyleService = inject(DynamicStyleService);
  private readonly _pluginLoaderService = inject(PluginLoaderService);
  private readonly _httpClient = inject(HttpClient);

  readonly parameters = this._parameterService.publicParameters;
  readonly cache = this._pluginLoaderService.cache;
  readonly pendingRequests = this._pluginLoaderService.pendingRequests;
  readonly elementsCode = ElementCode;

  readonly urlStatics = computed(
    () => findParameter('APP_STATICS_URL', this.parameters())?.value ?? '',
  );

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const element = this.element();      
      const languageId = this.languageId();
      this.reloadPlugin(element, languageId);
      untracked(() => {});
    });
  }

  /**
   * OnDestroy
   */
  ngOnDestroy(): void {
    this._dynamicStyleService.remove(`pluign-style-${this.element().uuid}`);
    if (this.element().kind === 'composite') {
      this.element().childrens.forEach((children) => {
        this._dynamicStyleService.remove(`pluign-style-${children.uuid}`);
      });
    }
  }

  /**
   * Emit event to select
   * @param uuid
   */
  selectElement(uuid: string): void {
    const element = this.element();
    if (element.uuid === uuid) {
      this.selectElementEvent.emit(element);
      return;
    }

    const findElement = (childrens: ElementI[]): ElementI | undefined => {
      for (const child of childrens) {
        if (child.uuid === uuid) return child;
        const found = findElement(child.childrens ?? []);
        if (found) return found;
      }
      return undefined;
    };

    const foundElement = findElement(element.childrens ?? []);
    if (!foundElement) return;
    this.selectElementEvent.emit(foundElement);
  }
  /**
   * Reload plugin
   * @param element
   * @param languageId
   * @returns
   */
  private async reloadPlugin(element: ElementI, languageId: number): Promise<void> {
    try {
      const elementRender = await this.buildElementRender(element, languageId, element.name);
      this.elementRender.set(elementRender);
      this._dynamicStyleService.set(`pluign-style-${this.element().uuid}`, this.element().css);
      this.hasError.set(false);
      this.errorMessage.set('');
      this.loading.set(false);
    } catch (error) {
      this.hasError.set(true);
      this.errorMessage.set('No se pudo cargar el plugin ' + element.name);
      this.loading.set(false);
    }
  }

  /**
   * Build properties of element render
   * @param element
   * @param languageId
   * @returns
   */
  async buildElementRender(
    element: ElementI,
    languageId: number,
    slot: string,
  ): Promise<PluginPropertiesI> {
    const componentText = this.getComponentText(element, languageId);

    const dataServices: PluginDataI = {
      service: null,
      customService: null,
    };

    if ('service' in element.config) {
      dataServices.service = await this.loadData(
        `${environment.apiUrl}${element.config['service']}`,
      );
    }

    if ('custom-service' in element.config) {
      dataServices.customService = await this.loadData(element.config['custom-service']);
    }

    const children = await Promise.all(
      (element.childrens ?? []).map((child) => {
        const slotChildren = element.childrenSchema.find((schema) => schema.uuid === child.uuid);
        return this.buildElementRender(child, languageId, slotChildren?.slot!);
      }),
    );
    this.loadStyles(element);

    return {
      config: element.config,
      text: componentText,
      uuid: element.uuid,
      name: element.name,
      kind: element.kind,
      dataServices,
      class: this.getClassName(element.css),
      styles: element.css,
      lang:
        window.location.pathname.split('/')[1]?.length === 2
          ? window.location.pathname.split('/')[1]
          : 'es',
      urlStatics: this.urlStatics(),
      slot,
      children,
    };
  }

  /**
   * Load elements styles
   * @param element
   */
  private loadStyles(element: ElementI) {
    this._dynamicStyleService.remove(`pluign-style-${element.uuid}`);
    this._dynamicStyleService.set(`pluign-style-${element.uuid}`, element.css);
  }

  /**
   * Get class name
   * @param css
   * @returns
   */
  private getClassName(css: string): string {
    const selector = css.split('{')[0]?.trim() ?? '';
    return selector.split('.')[1] ?? '';
  }

  /**
   * Get component text
   * @param element
   * @param languageId
   * @returns
   */
  private getComponentText(element: ElementI, languageId: number): { [key: string]: any } {
    if (!element.dataText?.length) return element.text;

    const translation = element.dataText.find((item) => Number(item['languageId']) === languageId);
    if (!translation) return element.text;

    const { languageId: _languageId, ...rest } = translation;
    return rest;
  }

  /**
   * Load data
   * @param url
   * @returns
   */
  private async loadData(url: string): Promise<any> {
    if (this.cache.has(url)) return this.cache.get(url);

    const pending = this.pendingRequests.get(url);
    if (pending) return pending;

    try {
      const request = lastValueFrom(this._httpClient.get(url));
      this.pendingRequests.set(url, request);
      const data = await request;
      this.cache.set(url, data);
      return data;
    } catch (error) {
      console.error(`Error obteniendo datos desde ${url}`, error);
      return null;
    } finally {
      this.pendingRequests.delete(url);
    }
  }
}
