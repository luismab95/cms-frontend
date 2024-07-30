import { AsyncPipe, NgClass } from '@angular/common';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { fuseAnimations } from '@fuse/animations';

import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { PaginationComponent } from 'app/shared/components/pagination/pagination.component';
import { PaginationResponseI } from 'app/shared/interfaces/response.interface';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { PageService } from './pages.service';
import { PageI, PagePaginationResquestI } from './pages.types';

@Component({
    selector: 'pages',
    templateUrl: './list.component.html',
    styles: [
        /* pages=SCSS */
        `
            .pages-grid {
                grid-template-columns: 24px auto 42px;

                @screen sm {
                    grid-template-columns: 24px auto 42px;
                }

                @screen md {
                    grid-template-columns: 24px auto 160px 42px;
                }

                @screen lg {
                    grid-template-columns: 24px auto 160px 80px 24px 42px;
                }
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatPaginatorModule,
        NgClass,
        AsyncPipe,
        PaginationComponent,
        MatTooltipModule,
    ],
})
export class PagesListComponent implements OnInit, OnDestroy {
    pagesCount: number = 0;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    pages$: Observable<PaginationResponseI<PageI[]>>;
    isLoading: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _pageService: PageService,
        private _router: Router,
        private _toastrService: ToastrService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the templates
        this.pages$ = this._pageService.pages$;
        this._pageService.pages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pages) => {
                // Update the templates
                this.pages$ = this._pageService.pages$;
                this.pagesCount = pages.total;
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
                        length: this.pagesCount,
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
        this._pageService
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
     * Go to detail page
     *
     * @param page
     */
    goToDetail(page?: PageI) {
        this._router.navigateByUrl('admin/modules/pages/detail', {
            state: { id: page?.id },
        });
    }
}
