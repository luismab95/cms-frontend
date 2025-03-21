import { HttpClient } from '@angular/common/http';
import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    inject,
    Input,
    OnDestroy,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { ElementI } from 'app/shared/interfaces/grid.interface';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { lastValueFrom, Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'elements',
    templateUrl: './elements.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [],
})
export class ElementsComponent implements OnDestroy, AfterViewInit {
    @Input() element: ElementI;
    @Input() languageId: number;
    @ViewChild('pluginContainer') pluginContainer: ElementRef<HTMLDivElement>;

    urlStatics: string;
    private _httpClient = inject(HttpClient);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private readonly _parameterService: ParameterService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this._parameterService.parameter$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((parameters: ParameterI[]) => {
                this.urlStatics = findParameter(
                    'APP_STATICS_URL',
                    parameters
                ).value;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * After Init
     */
    async ngAfterViewInit() {
        // Verificar si pluginContainer es null antes de acceder a appendChild
        let dataService: any = [];

        if (this.pluginContainer.nativeElement) {
            // load text languages
            let componentText = this.element.text;
            if (this.element?.dataText?.length > 0) {
                this.element.dataText.forEach((element) => {
                    if (Number(element['languageId']) === this.languageId) {
                        const { languageId, ...rest } = element;
                        componentText = {
                            ...rest,
                        };
                    }
                });
            }

            // load data
            if ('service' in this.element.config) {
                dataService = await this.loadData(this.element.config.service);
            }

            // load css
            const className = this.element.css.split('{')[0];

            // load html
            const html = await this.loadHTMLFile(
                `/plugins/${this.element.name.toLowerCase()}/${this.element.name.toLowerCase()}.html`
            );

            const div = document.createElement('div');
            div.id = `div-${this.element.uuid}`;
            div.style.width = '100%';
            div.style.height = 'auto';
            div.setAttribute(
                'data-properties',
                JSON.stringify({
                    properties: {
                        config: this.element.config,
                        text: componentText,
                        css: this.element.css,
                        uuid: this.element.uuid,
                        class: className.split('.')[1],
                        data: dataService,
                        urlStatics: this.urlStatics,
                    },
                })
            );
            div.innerHTML = html;

            // Agregar el div al contenedor del plugin
            this.pluginContainer.nativeElement.appendChild(div);

            // load script
            await this.loadScript(
                `/plugins/${this.element.name.toLowerCase()}/${this.element.name.toLowerCase()}.js`,
                this.element.name.toLowerCase()
            );

            // load data
            this.handleScriptLoaded(
                this.element.name.toLowerCase(),
                this.element.uuid
            );
        } else {
            console.error('No se pudo cargar el plugin');
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();

        // Remove all scripts
        //todo
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Load data
     */

    async loadData(url: string) {
        try {
            const data = await lastValueFrom(this._httpClient.get(url));
            return data;
        } catch (error) {
            console.error('Error al obtener los datos:', error);
        }
    }

    /**
     * Método para cargar el archivo HTML
     */
    async loadHTMLFile(filePath: string) {
        try {
            const html = await lastValueFrom(
                this._httpClient.get(filePath, { responseType: 'text' })
            );
            return html;
        } catch (error) {
            console.error('Error al cargar el plugin:', error);
        }
    }

    /**
     * Load script dynamically
     * @param src
     * @param scriptName
     */
    async loadScript(src: string, scriptName: string) {
        if (document.getElementById(`js-${scriptName}`)) {
            return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.type = 'text/javascript';
        script.id = `js-${scriptName}`;
        script.setAttribute('data-id', this.element.uuid);
        script.async = true;
        document.body.appendChild(script);

        await new Promise<void>((resolve, reject) => {
            script.onload = () => {
                resolve();
            };

            script.onerror = (error) => {
                console.error(
                    `Error al cargar el script ${src} con ID: ${scriptName}`
                );
                reject(new Error(`Error al cargar el script ${scriptName}`)); // Rechaza la promesa si hay un error
            };
        });
    }

    /**
     * Load uuid js
     * @param name
     * @param value
     */
    handleScriptLoaded(name: string, value: string) {
        if (window[`${name}PluginEvent`]) {
            window[`${name}PluginEvent`](value);
        }
    }
}
