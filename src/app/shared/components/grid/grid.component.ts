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
    signal,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ElementsComponent } from 'app/shared/components/element/elements.component';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
import { ColumnI, RowI, SectionI } from 'app/shared/interfaces/grid.interface';
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
    @Input() languageId: number;
    @Input() previewType: string = 'none';
    @Input() grid: SectionI[] = [];
    @Output() deleteSectionEvent: EventEmitter<SectionI[]> = new EventEmitter<
        SectionI[]
    >();

    refreshElement = signal<boolean>(false);

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
        this.loadStyles();
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

    loadStyles() {
        const styleElementToRemove = document.getElementById(
            'dynamicSectionStyles'
        );
        if (styleElementToRemove) {
            styleElementToRemove.remove();
        }
        const styleElement = document.createElement('style');
        styleElement.id = 'dynamicSectionStyles';

        this.grid.forEach((section) => {
            styleElement.textContent += `${section.css}`;
            section.rows.forEach((row) => {
                styleElement.textContent += `${row.css}`;
                row.columns.forEach((column) => {
                    styleElement.textContent += `${column.css}`;
                    if (column.element) {
                        styleElement.textContent += `${column.element.css}`;
                    }
                });
            });
        });
        document.head.appendChild(styleElement);
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any) {
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
    addRow(section: SectionI) {
        const rowUuid = generateRandomString(8);
        section.rows.push({
            uuid: rowUuid,
            css: `.grid-row-${rowUuid}{}`,
            config: {},
            columns: [],
        });
    }

    /**
     * Add column to rows
     * @param row
     */
    addColumn(row: RowI) {
        const columnUuid = generateRandomString(8);
        row.columns.push({
            uuid: columnUuid,
            css: `.grid-column-${columnUuid}{}`,
            config: {},
            element: null,
        });
    }

    /**
     * Add element to columns
     * @param column
     */
    addElement(column: ColumnI, element: ElementCMSI) {
        const elementUuid = generateRandomString(8);
        column.element = {
            uuid: elementUuid,
            name: element.name,
            css: `.${element.css}-${elementUuid}{}`,
            config: element.config,
            text: element.text,
        };

        // Mark for check
        this._changeDetectorRef.markForCheck();
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
    deleteRow(uuid: string, section: SectionI) {
        section.rows = section.rows.filter((item) => item.uuid !== uuid);
    }

    /**
     * Delete column to row
     * @param uuid
     * @param row
     */
    deleteColumn(uuid: string, row: RowI) {
        row.columns = row.columns.filter((item) => item.uuid !== uuid);
    }

    /**
     * Delete element to column
     * @param column
     */
    deleteElement(column: ColumnI) {
        column.element = null;
    }

    /**
     * Open modal settings detail
     *
     * @param data
     * @param item
     * @param isElemnet
     */
    openSettingsModal<T>(data: T, item: string, isElement: boolean): void {
        const dataModal = _.cloneDeep(data);
        const dialogRef = this._modalSvc.openModal<GridSettingsComponent, T>(
            GridSettingsComponent,
            { title: item, ...dataModal, isElement }
        );

        dialogRef.afterClosed().subscribe((result) => {
            if (result !== null) {
                this.refreshElement.set(true);
                data['css'] = result.css;
                data['config'] = result.config;
                isElement && (data['dataText'] = result.dataText);
                this.loadStyles();
                this._changeDetectorRef.markForCheck();
                setTimeout(() => {
                    this.refreshElement.set(false);
                }, 100);
            }
        });
    }

    /**
     * Open modal settings detail
     *
     * @param data
     */
    openElementsMangerModal(data: ColumnI): void {
        const dialogRef = this._modalSvc.openModal<
            ElementsManagerComponent,
            ColumnI
        >(ElementsManagerComponent, data);

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.addElement(data, result);
            }
        });
    }
}
