import { AsyncPipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { PageService } from 'app/modules/admin/pages/pages.service';
import {
    PageI,
    PagePaginationResquestI,
} from 'app/modules/admin/pages/pages.types';
import { PaginationComponent } from 'app/shared/components/pagination/pagination.component';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import { PaginationResponseI } from 'app/shared/interfaces/response.interface';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { MicrosityService } from '../../micrositie.service';
import { MicrositieI } from '../../micrositie.types';

@Component({
    selector: 'microsities-pages',
    templateUrl: './pages.component.html',
    styles: [
        /* language=SCSS */
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
export class MicrositiesPagesComponent implements OnInit {
    pagesCount: number = 0;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    pages$: Observable<PaginationResponseI<PageI[]>>;
    isLoading: boolean = false;
    micrositie: MicrositieI;
    permission = PermissionCode;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef,
        private _pageService: PageService,
        private _microsityService: MicrosityService,
        private _toastrService: ToastrService
    ) {
        this._microsityService.micrositie$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((micrositie) => {
                // Update the templates
                this.micrositie = micrositie;
                this._pageService
                    .getAll({
                        limit: 10,
                        micrositieId: micrositie?.id,
                        page: 1,
                        search: null,
                        status: true,
                    })
                    .subscribe();
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

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
            micrositieId: this.micrositie.id,
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
     * Go to detail page
     *
     * @param page
     */
    goToDetail(page?: PageI) {
        this._pageService.page = null;
        this._router.navigateByUrl('admin/modules/pages/detail', {
            state: { id: page?.id, micrositieId: this.micrositie.id },
        });
    }

    /**
     * Valid render permission
     */
    validPermission(code: string) {
        return validAction(code);
    }
}
