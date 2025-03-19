import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { ElementI } from 'app/shared/interfaces/grid.interface';
import { Subject } from 'rxjs';

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
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor() {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * After Iiit
     */
    ngAfterViewInit() {
        // Verificar si pluginContainer es null antes de acceder a appendChild
        if (this.pluginContainer.nativeElement) {
            const iframe = document.createElement('iframe');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            // Configurar el evento load para el iframe
            iframe.onload = () => {
                // load text languages
                let componentText = this.element.text;

                if (this.element.dataText.length > 0) {
                    this.element.dataText.forEach((element) => {
                        if (Number(element['languageId']) === this.languageId) {
                            const { languageId, ...rest } = element;
                            componentText = {
                                ...rest,
                            };
                        }
                    });
                }

                const className = this.element.css.split('{')[0];

                iframe.contentWindow.postMessage(
                    {
                        properties: {
                            config: this.element.config,
                            text: componentText,
                            css: this.element.css,
                            uuid: this.element.uuid,
                            class: className.split('.')[1],
                        },
                    },
                    '*'
                );
            };
            // Establecer la ruta al HTML del plugin después de configurar el evento load
            iframe.setAttribute(
                'src',
                `/plugins/${this.element.name.toLowerCase()}/${this.element.name.toLowerCase()}.html`
            );
            // Agregar el iframe al contenedor del plugin
            this.pluginContainer.nativeElement.appendChild(iframe);
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
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------
}
