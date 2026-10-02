import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { ParameterService, PluginLoaderService } from '@core/services';
import { ElementI } from '@shared/interfaces';
import { findParameter } from '@shared/utils';
import { environment } from 'environments/environment';
import { lastValueFrom } from 'rxjs';

type PluginEvent = (uuid: string) => void;

declare global {
  interface Window {
    [key: `${string}PluginEvent`]: PluginEvent;
  }
}

@Component({
  selector: 'elements',
  standalone: true,
  templateUrl: './elements.html',
})
export class ElementsComponent implements AfterViewInit, OnDestroy {
  private readonly pluginContainer =
    viewChild.required<ElementRef<HTMLDivElement>>('pluginContainer');

  readonly element = input.required<ElementI>();
  readonly languageId = input.required<number>();

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly urlStatics = signal('');

  private readonly http = inject(HttpClient);
  private readonly parameterService = inject(ParameterService);
  private readonly pluginLoader = inject(PluginLoaderService);

  readonly parameters = this.parameterService.parameters;

  private destroyed = false;
  private initialized = false;
  private previousPluginState: string | null = null;
  private pluginVersion = 0;

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const element = this.element();
      const languageId = this.languageId();
      if (!this.initialized || this.destroyed) return;

      const pluginState = JSON.stringify({
        uuid: element.uuid,
        name: element.name,
        config: element.config,
        text: element.text,
        css: element.css,
        dataText: element.dataText,
        languageId,
      });
      if (pluginState === this.previousPluginState) return;

      this.previousPluginState = pluginState;
      this.reloadPlugin(element, languageId);
    });
  }

  /**
   * AfterViewInit
   */
  async ngAfterViewInit(): Promise<void> {
    this.initialized = true;
    await this.reloadPlugin(this.element(), this.languageId());
  }

  /**
   * OnDestroy
   */
  ngOnDestroy(): void {
    this.destroyed = true;
    this.pluginVersion++;
    this.destroyPluginStyles();
    this.pluginContainer().nativeElement.replaceChildren();
  }

  /**
   * Reload plugin
   * @param element
   * @param languageId
   * @returns
   */
  private async reloadPlugin(element: ElementI, languageId: number): Promise<void> {
    const version = ++this.pluginVersion;
    this.loading.set(true);
    this.error.set(null);

    try {
      const pluginName = element.name.toLowerCase();
      const parameters = this.parameters();

      this.urlStatics.set(findParameter('APP_STATICS_URL', parameters)?.value ?? '');
      const componentText = this.getComponentText(element, languageId);

      let dataService: unknown = null;
      if ('service' in element.config)
        dataService = await this.loadData(`${environment.apiUrl}${element.config['service']}`);

      if (this.destroyed || version !== this.pluginVersion) return;

      if ('custom-service' in element.config)
        dataService = await this.loadData(element.config['custom-service']);

      if (this.destroyed || version !== this.pluginVersion) return;

      const html = await this.loadHTMLFile(`/plugins/${pluginName}/${pluginName}.html`);

      if (!html || this.destroyed || version !== this.pluginVersion) return;

      const div = document.createElement('div');
      div.id = `div-${element.uuid}`;
      div.style.width = '100%';
      div.style.height = 'auto';

      const properties = {
        properties: {
          config: element.config,
          text: componentText,
          uuid: element.uuid,
          class: this.getClassName(element.css),
          data: dataService,
          lang:
            window.location.pathname.split('/')[1].length == 2
              ? window.location.pathname.split('/')[1]
              : 'es',
          urlStatics: this.urlStatics(),
        },
      };

      div.setAttribute('data-properties', JSON.stringify(properties));
      div.innerHTML = html;
      if (this.destroyed || version !== this.pluginVersion) return;

      this.pluginContainer().nativeElement.replaceChildren(div);

      await this.pluginLoader.load(`/plugins/${pluginName}/${pluginName}.js`, pluginName);
      if (this.destroyed || version !== this.pluginVersion) return;

      this.handleScriptLoaded(pluginName, element.uuid);
      if (this.destroyed || version !== this.pluginVersion) return;

      this.loading.set(false);
    } catch (error) {
      if (this.destroyed || version !== this.pluginVersion) return;
      this.error.set('No se pudo cargar el plugin ' + element.name);
      this.loading.set(false);
    }
  }

  /**
   * Get component text
   * @param element
   * @param languageId
   * @returns
   */
  private getComponentText(element: ElementI, languageId: number): unknown {
    if (!element.dataText?.length) return element.text;

    const translation = element.dataText.find((item) => Number(item['languageId']) === languageId);
    if (!translation) return element.text;

    const { languageId: _languageId, ...rest } = translation;
    return rest;
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
   * Load data
   * @param url
   * @returns
   */
  private async loadData(url: string): Promise<unknown> {
    try {
      return await lastValueFrom(this.http.get(url));
    } catch (error) {
      console.error(`Error obteniendo datos desde ${url}`, error);
      return null;
    }
  }

  /**
   * Load HTML File
   * @param filePath
   * @returns
   */
  private async loadHTMLFile(filePath: string): Promise<string | null> {
    try {
      return await lastValueFrom(
        this.http.get(filePath, {
          responseType: 'text',
        }),
      );
    } catch (error) {
      console.error(`Error cargando HTML: ${filePath}`, error);
      return null;
    }
  }

  /**
   * Handle ScriptLoaded
   * @param pluginName
   * @param uuid
   */
  private handleScriptLoaded(pluginName: string, uuid: string): void {
    const eventName = `${pluginName}PluginEvent` as `${string}PluginEvent`;
    const event = window[eventName];

    if (typeof event === 'function') {
      event(uuid);
    } else {
      console.error(`No existe ${eventName}`);
    }
  }

  /**
   * Destroy plugin styles
   * @returns
   */
  private destroyPluginStyles(): void {
    const uuid = this.element()?.uuid;
    if (!uuid) return;
    const style = document.getElementById(`style-${uuid}`);
    style?.remove();
  }
}
