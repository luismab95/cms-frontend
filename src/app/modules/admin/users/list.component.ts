import { AsyncPipe, NgClass, TitleCasePipe } from '@angular/common';
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
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { UserService } from 'app/core/user/user.service';
import { RoleI, UserI } from 'app/core/user/user.types';
import { PaginationComponent } from 'app/shared/components/pagination/pagination.component';
import {
    PaginationResponseI,
    PaginationResquestI,
} from 'app/shared/interfaces/response.interface';
import { ModalService } from 'app/shared/services/modal.service';
import { RoleService } from 'app/shared/services/role.service';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { UsersDetailsComponent } from './details/details.component';

@Component({
    selector: 'users-list',
    templateUrl: './list.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatSidenavModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        NgClass,
        AsyncPipe,
        MatSelectModule,
        MatOptionModule,
        TitleCasePipe,
        MatPaginatorModule,
        PaginationComponent,
    ],
})
export class UsersListComponent implements OnInit, OnDestroy {
    usersCount: number = 0;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    users$: Observable<PaginationResponseI<UserI[]>>;
    roles: RoleI[] = [];
    isLoading: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _userService: UserService,
        private _roleService: RoleService,
        private _modalSvc: ModalService,
        private _toastrService: ToastrService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the users
        this.users$ = this._userService.users$;
        this._userService.users$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((users) => {
                // Update the users
                this.users$ = this._userService.users$;
                this.usersCount = users.total;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the Roles
        this._roleService.roles$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((roles) => {
                // Update the roles
                this.roles = roles;
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
                        length: this.usersCount,
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
        this._userService
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
     * Find role
     * @param roleId
     */
    getRole(roleId: number) {
        return this.roles.find((role) => role.id === roleId).name || '';
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
     * Open modal laguanges detail
     *
     * @param data
     */
    openDetailsModal(data?: UserI): void {
        const dialogRef = this._modalSvc.openModal<
            UsersDetailsComponent,
            UserI
        >(UsersDetailsComponent, data);

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.getAll({
                    pageSize: 10,
                    pageIndex: 0,
                    length: this.usersCount,
                });
            }
        });
    }
}
