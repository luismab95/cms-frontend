import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation,
} from '@angular/core';
import { Subject } from 'rxjs';

@Component({
    selector: 'elements',
    templateUrl: './elements.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [],
})
export class ElementsComponent implements OnInit, OnDestroy, AfterViewInit {
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
     * On init
     */
    ngOnInit(): void {}

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
                iframe.contentWindow.postMessage(
                    {
                        properties: {
                            config: { go: 'https://chatgpt.com/' },
                            text: {
                                ref: 'lorem ipsum...',
                            },
                            css: `.modern-button {
    display: inline-block;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: bold;
    color: #fff;
    text-align: center;
    text-decoration: none;
    border: none;
    border-radius: 8px;
    background-color: #4CAF50; /* Color de fondo */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* Sombra */
    transition: background-color 0.3s ease, transform 0.2s ease-in-out;
    cursor: pointer;
}

.modern-button:hover {
    background-color: #45a049; /* Cambio de color al pasar el ratón */
    transform: translateY(-2px); /* Efecto de elevación */
}

.modern-button:active {
    transform: translateY(0);
    box-shadow: none; /* Elimina la sombra al hacer clic */
}`,
                        },
                    },
                    '*'
                );
            };
            // Establecer la ruta al HTML del plugin después de configurar el evento load
            iframe.setAttribute('src', '/plugins/test/test.html');
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
