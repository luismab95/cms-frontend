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
import { fuseAnimations } from '@fuse/animations';

import { PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { PaginationComponent } from 'app/shared/components/pagination/pagination.component';
import {
    PaginationResponseI,
    PaginationResquestI,
} from 'app/shared/interfaces/response.interface';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { MicrosityService } from './micrositie.service';
import { MicrositieI } from './micrositie.types';

@Component({
    selector: 'micrositie',
    templateUrl: './list.component.html',
    styles: [
        /* microsities=SCSS */
        `
            .microsities-grid {
                grid-template-columns: 24px auto 24px;

                @screen sm {
                    grid-template-columns: 24px auto 112px 24px;
                }

                @screen md {
                    grid-template-columns: 24px 112px auto 112px 24px 24px;
                }

                @screen lg {
                    grid-template-columns: 24px 112px auto 96px 80px 24px 24px;
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
        AsyncPipe,
        PaginationComponent,
        MatTooltipModule,
    ],
})
export class MicrositieListComponent implements OnInit, OnDestroy {
    micrositiesCount: number = 0;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    microsities$: Observable<PaginationResponseI<MicrositieI[]>>;
    isLoading: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _microsityService: MicrosityService,
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
        // Get the microsities
        this.microsities$ = this._microsityService.microsities$;
        this._microsityService.microsities$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((templates) => {
                // Update the templates
                this.microsities$ = this._microsityService.microsities$;
                this.micrositiesCount = templates.total;
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
                        length: this.micrositiesCount,
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
        this._microsityService
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
     * @param micrositie
     */
    goToDetail(micrositie?: MicrositieI) {
        this._microsityService.micrositie = micrositie;
        this._router.navigateByUrl('admin/modules/microsities/detail');
    }
}
