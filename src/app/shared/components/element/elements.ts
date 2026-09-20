import {
  AfterViewInit,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { ParameterService } from 'app/core/services/parameter.service';
import { ElementI } from 'app/shared/interfaces/grid.interface';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PluginLoaderService } from 'app/core/services/plugin-loader.service';
import { environment } from 'environments/environment';

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
  @ViewChild('pluginContainer', {
    static: true,
  })
  pluginContainer!: ElementRef<HTMLDivElement>;

  readonly element = input.required<ElementI>();

  readonly languageId = input.required<number>();

  readonly loading = signal(true);

  readonly error = signal<string | null>(null);

  readonly urlStatics = signal('');

  private readonly http = inject(HttpClient);

  private readonly parameterService = inject(ParameterService);

  private readonly pluginLoader = inject(PluginLoaderService);

  readonly parameters = toSignal(this.parameterService.parameter$, {
    initialValue: [],
  });

  /**
   * Indica que el componente fue destruido.
   */
  private destroyed = false;

  /**
   * Indica que ngAfterViewInit ya terminó.
   *
   * El effect no debe intentar cargar el plugin
   * antes de que el ViewChild esté disponible.
   */
  private initialized = false;

  /**
   * Controla las cargas concurrentes del plugin.
   *
   * Si el usuario modifica varias veces rápidamente,
   * una carga vieja no podrá sobrescribir una nueva.
   */
  private pluginVersion = 0;

  constructor() {
    /**
     * Detecta cambios en:
     *
     * - element()
     * - languageId()
     *
     * Cada vez que alguno cambie, se vuelve a cargar
     * el contenido del plugin.
     */
    effect(() => {
      const element = this.element();

      const languageId = this.languageId();

      /**
       * La primera carga se realiza en ngAfterViewInit.
       */
      if (!this.initialized) {
        return;
      }

      /**
       * Evita ejecutar el effect sin necesidad.
       */
      if (this.destroyed) {
        return;
      }

      void this.reloadPlugin(element, languageId);
    });
  }

  // --------------------------------------------------
  // Angular lifecycle
  // --------------------------------------------------

  async ngAfterViewInit(): Promise<void> {
    this.initialized = true;

    await this.reloadPlugin(this.element(), this.languageId());
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    /**
     * Invalida cualquier carga pendiente.
     */
    this.pluginVersion++;

    this.destroyPluginStyles();

    /**
     * Limpia el HTML generado por el plugin.
     */
    this.pluginContainer?.nativeElement.replaceChildren();
  }

  // --------------------------------------------------
  // LOAD / RELOAD PLUGIN
  // --------------------------------------------------

  private async reloadPlugin(element: ElementI, languageId: number): Promise<void> {
    /**
     * Generamos una versión única para esta carga.
     *
     * Si llega otra actualización mientras esta carga
     * está esperando HTTP, esta versión quedará obsoleta.
     */
    const version = ++this.pluginVersion;

    this.loading.set(true);
    this.error.set(null);

    try {
      const pluginName = element.name.toLowerCase();

      // --------------------------------------------------
      // STATIC URL
      // --------------------------------------------------

      const parameters = this.parameters();

      this.urlStatics.set(findParameter('APP_STATICS_URL', parameters)?.value ?? '');

      // --------------------------------------------------
      // COMPONENT TEXT
      // --------------------------------------------------

      const componentText = this.getComponentText(element, languageId);

      // --------------------------------------------------
      // LOAD SERVICE DATA
      // --------------------------------------------------

      let dataService: unknown = null;

      if ('service' in element.config) {
        dataService = await this.loadData(`${environment.apiUrl}${element.config['service']}`);
      }

      if (this.destroyed || version !== this.pluginVersion) {
        return;
      }

      if ('custom-service' in element.config) {
        dataService = await this.loadData(element.config['custom-service']);
      }

      if (this.destroyed || version !== this.pluginVersion) {
        return;
      }

      // --------------------------------------------------
      // LOAD HTML
      // --------------------------------------------------

      const html = await this.loadHTMLFile(`/plugins/${pluginName}/${pluginName}.html`);

      if (!html || this.destroyed || version !== this.pluginVersion) {
        return;
      }

      // --------------------------------------------------
      // CREATE PLUGIN CONTAINER
      // --------------------------------------------------

      const div = document.createElement('div');

      div.id = `div-${element.uuid}`;

      div.style.width = '100%';

      div.style.height = 'auto';

      // --------------------------------------------------
      // PLUGIN PROPERTIES
      // --------------------------------------------------

      const properties = {
        properties: {
          config: element.config,

          text: componentText,

          css: element.css,

          uuid: element.uuid,

          class: this.getClassName(element.css),

          data: dataService,

          urlStatics: this.urlStatics(),
        },
      };

      div.setAttribute('data-properties', JSON.stringify(properties));

      // --------------------------------------------------
      // INSERT HTML
      // --------------------------------------------------

      div.innerHTML = html;

      /**
       * Verificamos nuevamente porque el HTML
       * pudo tardar en descargarse.
       */
      if (this.destroyed || version !== this.pluginVersion) {
        return;
      }

      this.pluginContainer.nativeElement.replaceChildren(div);

      // --------------------------------------------------
      // LOAD JS
      // --------------------------------------------------

      await this.pluginLoader.load(`/plugins/${pluginName}/${pluginName}.js`, pluginName);

      if (this.destroyed || version !== this.pluginVersion) {
        return;
      }

      // --------------------------------------------------
      // INITIALIZE PLUGIN
      // --------------------------------------------------

      this.handleScriptLoaded(pluginName, element.uuid);

      if (this.destroyed || version !== this.pluginVersion) {
        return;
      }

      this.loading.set(false);
    } catch (error) {
      /**
       * Si la carga quedó obsoleta no mostramos error.
       */
      if (this.destroyed || version !== this.pluginVersion) {
        return;
      }

      console.error('Error cargando plugin:', error);

      this.error.set('No se pudo cargar el plugin ' + element.name);

      this.loading.set(false);
    }
  }

  // --------------------------------------------------
  // TEXT
  // --------------------------------------------------

  private getComponentText(element: ElementI, languageId: number): unknown {
    /**
     * No existen traducciones.
     */
    if (!element.dataText?.length) {
      return element.text;
    }

    /**
     * Buscar traducción del idioma seleccionado.
     */
    const translation = element.dataText.find((item) => Number(item['languageId']) === languageId);

    /**
     * No existe traducción para ese idioma.
     */
    if (!translation) {
      return element.text;
    }

    /**
     * No enviar languageId al plugin.
     */
    const { languageId: _languageId, ...rest } = translation;

    return rest;
  }

  // --------------------------------------------------
  // CSS CLASS
  // --------------------------------------------------

  private getClassName(css: string): string {
    const selector = css.split('{')[0]?.trim() ?? '';

    return selector.split('.')[1] ?? '';
  }

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  private async loadData(url: string): Promise<unknown> {
    try {
      return await lastValueFrom(this.http.get(url));
    } catch (error) {
      console.error(`Error obteniendo datos desde ${url}`, error);

      return null;
    }
  }

  // --------------------------------------------------
  // LOAD HTML
  // --------------------------------------------------

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

  // --------------------------------------------------
  // PLUGIN EVENTS
  // --------------------------------------------------

  private handleScriptLoaded(pluginName: string, uuid: string): void {
    const eventName = `${pluginName}PluginEvent` as `${string}PluginEvent`;

    const event = window[eventName];

    if (typeof event === 'function') {
      event(uuid);
    } else {
      console.error(`No existe ${eventName}`);
    }
  }

  // --------------------------------------------------
  // DESTROY PLUGIN STYLES
  // --------------------------------------------------

  private destroyPluginStyles(): void {
    const uuid = this.element()?.uuid;

    if (!uuid) {
      return;
    }

    const style = document.getElementById(`style-${uuid}`);

    style?.remove();
  }
}
