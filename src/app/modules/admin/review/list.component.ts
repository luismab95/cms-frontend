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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { fuseAnimations } from '@fuse/animations';

import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { PaginationComponent } from 'app/shared/components/pagination/pagination.component';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import {
    PaginationResponseI,
    PaginationResquestI,
} from 'app/shared/interfaces/response.interface';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { ReviewPageService } from './review.service';
import { PageReviewDataI } from './review.types';

@Component({
    selector: 'reviews',
    templateUrl: './list.component.html',
    styles: [
        /* pages=SCSS */
        `
            .review-pages-grid {
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
        AsyncPipe,
        PaginationComponent,
        MatTooltipModule,
        PermissionComponent,
    ],
})
export class ReviewListComponent implements OnInit, OnDestroy {
    pagesCount: number = 0;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    pages$: Observable<PaginationResponseI<PageReviewDataI[]>>;
    isLoading: boolean = false;
    permission = PermissionCode;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _reviewPageService: ReviewPageService,
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
        this.pages$ = this._reviewPageService.pages$;
        this._reviewPageService.pages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pages) => {
                // Update the templates
                this.pages$ = this._reviewPageService.pages$;
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
        const params: PaginationResquestI = {
            page: event?.pageIndex + 1,
            limit: event?.pageSize,
            search,
            status,
        };
        this.isLoading = true;
        this._reviewPageService
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
     * Go to detail page
     * @param page
     */
    goToDetail(page: PageReviewDataI) {
        this._reviewPageService.page = null;
        this._router.navigateByUrl('admin/modules/review-pages/detail', {
            state: { id: page?.id },
        });
    }

    /**
     * Valid render permission
     */
    validPermission(code: string) {
        return validAction(code);
    }
}
