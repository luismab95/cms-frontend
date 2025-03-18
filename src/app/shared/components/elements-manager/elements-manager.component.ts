import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormControl,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PagePaginationResquestI } from 'app/modules/admin/pages/pages.types';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
import { PaginationResponseI } from 'app/shared/interfaces/response.interface';
import { ElementService } from 'app/shared/services/element.service';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { PaginationComponent } from '../pagination/pagination.component';

@Component({
    selector: 'elements-manager',
    templateUrl: './elements-manager.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        FormsModule,
        AsyncPipe,
        PaginationComponent,
    ],
})
export class ElementsManagerComponent implements OnInit, OnDestroy {
    elementsCount: number = 0;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    elements$: Observable<PaginationResponseI<ElementCMSI[]>>;
    selectedElement: ElementCMSI;
    isLoading: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _toastrService: ToastrService,
        private _elementService: ElementService,
        public _matDialogRef: MatDialogRef<ElementsManagerComponent>
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the templates
        this.elements$ = this._elementService.elements$;
        this._elementService.elements$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((elements) => {
                // Update the elements
                this.elements$ = this._elementService.elements$;
                this.elementsCount = elements.total;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(debounceTime(700))
            .subscribe((search: string) => {
                this.getAll(
                    {
                        pageSize: 10,
                        pageIndex: 0,
                        length: this.elementsCount,
                    },
                    search === '' ? null : search,
                    search === '' ? true : null
                );
            });
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
     * Get all
     * @param page
     */
    getAll(
        event: PageEvent,
        search: string | null = null,
        status: boolean = true
    ) {
        const params: PagePaginationResquestI = {
            page: event?.pageIndex + 1,
            limit: event?.pageSize,
            micrositieId: null,
            search,
            status,
        };
        this.isLoading = true;

        this._elementService
            .getAll(params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (res) => {
                    this.isLoading = false;
                },
                error: (response) => {
                    this.isLoading = false;

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

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
     * Set element
     * @param element
     */
    selectElememt(element: ElementCMSI) {
        this.selectedElement = element;
    }

    /**
     * Add element
     */
    addElement() {
        this._matDialogRef.close(this.selectedElement);
    }
}
