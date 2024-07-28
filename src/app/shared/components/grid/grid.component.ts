import {
    CdkDrag,
    CdkDragDrop,
    CdkDragHandle,
    CdkDropList,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ElementsComponent } from 'app/shared/components/element/elements.component';
import { ModalService } from 'app/shared/services/modal.service';
import { generateRandomString } from 'app/shared/utils/random.utils';
import * as _ from 'lodash';
import { Subject } from 'rxjs';
import { ElementsManagerComponent } from '../elements-manager/elements-manager.component';
import { GridSettingsComponent } from './settings/settings.component';

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
        CdkDropList,
        CdkDrag,
        CdkDragHandle,
        ElementsComponent,
    ],
})
export class GridComponent implements OnInit {
    @Input() preview: boolean = false;
    @Input() previewType: string = 'none';
    @Input() grid: any[] = [];
    @Output() deleteSectionEvent: EventEmitter<any[]> = new EventEmitter<
        any[]
    >();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _modalSvc: ModalService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Load CSS
        const styleElement = document.createElement('style');
        styleElement.textContent = `.grid-section {
             background-color: gray; /* Example background color */
             color: #333; /* Example text color */
             min-height:200px; /* Example height */
         }
             .grid-row {
             background-color: gray; /* Example background color */
             color: #333; /* Example text color */
             min-height:200px; /* Example height */
         }
             .grid-col {
             background-color: gray; /* Example background color */
             color: #333; /* Example text color */
             min-height:200px; /* Example height */
             width:50%; /* Example width */

         }`;
        document.head.appendChild(styleElement);
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

    /**
     * Drag and drop event
     * @param event
     * @param item
     */
    drop<T>(event: CdkDragDrop<string[]>, items: T[]) {
        moveItemInArray(items, event.previousIndex, event.currentIndex);
    }

    /**
     * Add row to sections
     * @param row
     */
    addRow(section: any) {
        section.rows.push({
            uuid: generateRandomString(8),
            css: {},
            config: {},
            columns: [],
        });
    }

    /**
     * Add column to rows
     * @param row
     */
    addColumn(row: any) {
        row.columns.push({
            uuid: generateRandomString(8),
            css: {},
            config: {},
            element: null,
        });
    }

    /**
     * Add element to columns
     * @param column
     */
    addElement(column: any) {
        column.element = {
            uuid: generateRandomString(8),
            name: 'Boton',
            css: {},
            config: {},
            text: {
                ref: 'lorem ipsum...',
            },
        };
    }

    /**
     * Delete section to grid
     * @param uuid
     */
    deleteSection(uuid: string) {
        this.grid = this.grid.filter((item) => item.uuid !== uuid);
        this.deleteSectionEvent.emit(this.grid);
    }

    /**
     * Delete row to section
     * @param uuid
     * @param section
     */
    deleteRow(uuid: string, section: any) {
        section.rows = section.rows.filter((item) => item.uuid !== uuid);
    }

    /**
     * Delete column to row
     * @param uuid
     * @param row
     */
    deleteColumn(uuid: string, row: any) {
        row.columns = row.columns.filter((item) => item.uuid !== uuid);
    }

    /**
     * Delete element to column
     * @param column
     */
    deleteElement(column: any) {
        column.element = null;
    }

    /**
     * Open modal settings detail
     *
     * @param data
     * @param item
     */
    openSettingsModal<T>(data: T, item: string): void {
        const dataModal = _.cloneDeep(data);
        this._modalSvc.openModal<GridSettingsComponent, T>(
            GridSettingsComponent,
            { title: item, ...dataModal }
        );
    }

    /**
     * Open modal settings detail
     *
     * @param data
     */
    openElementsMangerModal<T>(data: any): void {
        this._modalSvc.openModal<ElementsManagerComponent, T>(
            ElementsManagerComponent,
            data
        );
        this.addElement(data);
    }
}
