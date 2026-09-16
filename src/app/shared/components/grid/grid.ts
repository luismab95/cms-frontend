import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { NgClass } from '@angular/common';
import { Component, effect, input, OnInit, output, signal } from '@angular/core';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
import { ColumnI, RowI, SectionI } from 'app/shared/interfaces/grid.interface';
import { ElementsComponent } from '../element/elements';
import { generateRandomString } from 'app/shared/utils/random.utils';
import * as _ from 'lodash';
import { Subject } from 'rxjs';

@Component({
  selector: 'grid',
  templateUrl: './grid.html',
  imports: [NgClass, CdkDropList, CdkDrag, CdkDragHandle, ElementsComponent],
})
export class GridComponent implements OnInit {
  preview = input<boolean>(false);
  editContent = input<boolean>(false);
  editDesign = input<boolean>(false);
  gridType = input<string>('body');
  languageId = input<number>();
  previewType = input<string>('none');
  grid = input<SectionI[]>([]);
  deleteSectionEvent = output<SectionI[]>();

  sections = signal<SectionI[]>([]);
  refreshElement = signal<boolean>(false);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const grid = this.grid();
      this.sections.set(grid);
    });
  }

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

  /**
   * Load styles
   */
  loadStyles() {
    const styleElementToRemove = document.getElementById(`${this.gridType}-dynamicSectionStyles`);
    if (styleElementToRemove) {
      styleElementToRemove.remove();
    }
    const styleElement = document.createElement('style');
    styleElement.id = `${this.gridType}-dynamicSectionStyles`;

    this.grid().forEach((section) => {
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
      config: { backgroundImage: '' },
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
      config: { backgroundImage: '' },
      element: null!,
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
  }

  /**
   * Delete section to grid
   * @param uuid
   */
  deleteSection(uuid: string) {
    const grid = this.sections().filter((item) => item.uuid !== uuid);
    this.sections.set(grid);
    this.deleteSectionEvent.emit(this.sections());
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
    column.element = null!;
  }

  /**
   * Open modal settings detail
   *
   * @param data
   * @param item
   * @param isElemnet
   */
  openSettingsModal<T>(data: T, item: string, isElement: boolean): void {
    // const dataModal = _.cloneDeep(data);
    // const dialogRef = this._modalSvc.openModal<GridSettingsComponent, T>(GridSettingsComponent, {
    //   title: item,
    //   ...dataModal,
    //   isElement,
    // });
    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result !== null) {
    //     this.refreshElement.set(true);
    //     data['css'] = result.css;
    //     data['config'] = result.config;
    //     isElement && (data['dataText'] = result.dataText);
    //     this.loadStyles();
    //     this._changeDetectorRef.markForCheck();
    //     setTimeout(() => {
    //       this.refreshElement.set(false);
    //     }, 100);
    //   }
    // });
  }

  /**
   * Open modal settings detail
   *
   * @param data
   */
  openElementsMangerModal(data: ColumnI): void {
    // const dialogRef = this._modalSvc.openModal<ElementsManagerComponent, ColumnI>(
    //   ElementsManagerComponent,
    //   data,
    // );
    // dialogRef.afterClosed().subscribe((result) => {
    //   if (result) {
    //     this.addElement(data, result);
    //   }
    // });
  }
}
