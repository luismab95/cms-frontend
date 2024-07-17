import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    Input,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';

@Component({
    selector: 'grid',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        NgClass,
        MatTooltipModule,
    ],
})
export class GridComponent implements OnInit {
    @Input() preview: boolean = false;
    @Input() previewType: string;
    grid: any[] = [];
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
    ngOnInit(): void {
        //Set data grid
        this.grid = [
            {
                uuid: '1',
                css: {},
                config: {},
                rows: [
                    {
                        uuid: '1',
                        css: {},
                        config: {},
                        columns: [
                            {
                                uuid: '1',
                                css: {},
                                config: {},
                                element: {},
                            },
                            {
                                uuid: '2',
                                css: {},
                                config: {},
                                element: {},
                            },
                        ],
                    },
                ],
            },
            {
                uuid: '1',
                css: {},
                config: {},
                rows: [
                    {
                        uuid: '1',
                        css: {},
                        config: {},
                        columns: [
                            {
                                uuid: '1',
                                css: {},
                                config: {},
                                element: {},
                            },
                            {
                                uuid: '2',
                                css: {},
                                config: {},
                                element: {},
                            },
                            {
                                uuid: '1',
                                css: {},
                                config: {},
                                element: {},
                            },
                            {
                                uuid: '2',
                                css: {},
                                config: {},
                                element: {},
                            },
                        ],
                    },
                    {
                        uuid: '1',
                        css: {},
                        config: {},
                        columns: [
                            {
                                uuid: '1',
                                css: {},
                                config: {},
                                element: {},
                            },
                            {
                                uuid: '2',
                                css: {},
                                config: {},
                                element: {},
                            },
                            {
                                uuid: '2',
                                css: {},
                                config: {},
                                element: {},
                            },
                        ],
                    },
                ],
            },
        ];
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

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
