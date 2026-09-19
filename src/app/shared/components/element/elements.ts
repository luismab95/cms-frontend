import {
  AfterViewInit,
  Component,
  ElementRef,
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

  private destroyed = false;

  async ngAfterViewInit(): Promise<void> {
    await this.loadPlugin();
  }

  /**
   * On Destroy
   */
  ngOnDestroy(): void {
    this.destroyed = true;
    this.destroyPluginStyles();
  }

  // --------------------------------------------------
  // LOAD PLUGIN
  // --------------------------------------------------
  private async loadPlugin(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const element = this.element();

      const pluginName = element.name.toLowerCase();

      // URL STATIC
      const parameters = this.parameters();
      this.urlStatics.set(findParameter('APP_STATICS_URL', parameters)?.value ?? '');

      // COMPONENT TEXT
      const componentText = this.getComponentText();

      // LOAD SERVICE DATA
      let dataService: unknown = null;
      if ('service' in element.config) {
        dataService = await this.loadData(`${environment.apiUrl}${element.config['service']}`);
      }

      if ('custom-service' in element.config) {
        dataService = await this.loadData(element.config['custom-service']);
      }

      if (this.destroyed) {
        return;
      }

      // LOAD HTML
      const html = await this.loadHTMLFile(`/plugins/${pluginName}/${pluginName}.html`);
      if (!html) {
        throw new Error(`No se pudo cargar el HTML de ${pluginName}`);
      }
      if (this.destroyed) {
        return;
      }

      // CREATE PLUGIN CONTAINER
      const div = document.createElement('div');
      div.id = `div-${element.uuid}`;
      div.style.width = '100%';
      div.style.height = 'auto';

      // PLUGIN PROPERTIES
      div.setAttribute(
        'data-properties',
        JSON.stringify({
          properties: {
            config: element.config,
            text: componentText,
            css: element.css,
            uuid: element.uuid,
            class: this.getClassName(element.css),
            data: dataService,
            urlStatics: this.urlStatics(),
          },
        }),
      );

      div.innerHTML = html;

      // INSERT HTML
      this.pluginContainer.nativeElement.replaceChildren(div);

      // LOAD JS
      await this.pluginLoader.load(`/plugins/${pluginName}/${pluginName}.js`, pluginName);
      if (this.destroyed) {
        return;
      }
      if (this.destroyed) {
        return;
      }

      // INITIALIZE PLUGIN
      this.handleScriptLoaded(pluginName, element.uuid);
      this.loading.set(false);
    } catch (error) {
      console.error('Error cargando plugin:', error);
      this.error.set('No se pudo cargar el plugin ' + this.element().name);
      this.loading.set(false);
    }
  }

  /**
   * Text
   * @returns
   */
  private getComponentText(): unknown {
    const element = this.element();

    if (!element.dataText?.length) {
      return element.text;
    }

    const translation = element.dataText.find(
      (item) => Number(item['languageId']) === this.languageId(),
    );

    if (!translation) {
      return element.text;
    }

    const { languageId, ...rest } = translation;

    return rest;
  }

  /**
   * Class
   * @param css
   * @returns
   */
  private getClassName(css: string): string {
    const selector = css.split('{')[0]?.trim() ?? '';

    return selector.split('.')[1] ?? '';
  }

  /**
   * Data
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
   * Html
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
   * Events
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
   * Destroy
   * @returns
   */
  private destroyPluginStyles(): void {
    const uuid = this.element()?.uuid;
    if (!uuid) {
      return;
    }
    const style = document.getElementById(`style-${uuid}`);
    style?.remove();
  }
}
