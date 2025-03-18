import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import {
    MatPaginatorIntl,
    MatPaginatorModule,
    PageEvent,
} from '@angular/material/paginator';
import { Subject } from 'rxjs';

@Component({
    selector: 'pagination',
    templateUrl: './pagination.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [MatPaginatorModule, NgClass],
})
export class PaginationComponent implements OnInit, OnDestroy {
    @Input() page: number;
    @Input() pages: number;
    @Input() limit: number;
    @Input() total: number;
    @Input() isLoading: boolean = false;
    @Output() pageEvent: EventEmitter<PageEvent> =
        new EventEmitter<PageEvent>();
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(private paginator: MatPaginatorIntl) {
        this.paginator.itemsPerPageLabel = 'Registros por página:';
        this.paginator.getRangeLabel = (
            page: number,
            pageSize: number,
            length: number
        ) => {
            page++;
            let initailRecord = page;
            let endRecordPage = page;

            if (page !== 1) {
                initailRecord = page * pageSize;
                initailRecord = initailRecord - pageSize + 1;
            }

            if (page * pageSize > length) {
                endRecordPage = length;
            } else {
                endRecordPage = page * pageSize;
            }

            return `${initailRecord} - ${endRecordPage} de ${length}`;
        };
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {}

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
     * Emitt event page change
     * @param event
     */
    changeEvent(event: PageEvent) {
        this.pageEvent.emit(event);
    }
}
