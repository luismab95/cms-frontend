import {
    AsyncPipe,
    I18nPluralPipe,
    NgClass,
    TitleCasePipe,
} from '@angular/common';
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
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ModalService } from 'app/shared/services/modal.service';
import { Observable, Subject, switchMap, takeUntil } from 'rxjs';
import { UsersDetailsComponent } from '../details/details.component';
import { ContactsService } from '../users.service';
import { Contact, Country } from '../users.types';

@Component({
    selector: 'users-list',
    templateUrl: './list.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatSidenavModule,
        RouterOutlet,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        NgClass,
        RouterLink,
        AsyncPipe,
        I18nPluralPipe,
        MatSelectModule,
        MatOptionModule,
        TitleCasePipe,
        MatPaginatorModule,
    ],
})
export class UsersListComponent implements OnInit, OnDestroy {
    roles: any[];
    contacts$: Observable<Contact[]>;
    users: any[] = [];
    contactsCount: number = 0;
    contactsTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    countries: Country[];
    drawerMode: 'side' | 'over';
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedContact: Contact;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _contactsService: ContactsService,
        private _modalSvc: ModalService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Setup the roles
        this.roles = [
            {
                label: 'Read',
                value: 'read',
                description:
                    'Can read and clone this repository. Can also open and comment on issues and pull requests.',
            },
            {
                label: 'Write',
                value: 'write',
                description:
                    'Can read, clone, and push to this repository. Can also manage issues and pull requests.',
            },
            {
                label: 'Admin',
                value: 'admin',
                description:
                    'Can read, clone, and push to this repository. Can also manage issues, pull requests, and repository settings, including adding collaborators.',
            },
        ];

        this.contactsCount = 80;

        this.users = [
            {
                name: 'John Mar',
                lastname: 'Doe Test',
                email: 'johndoe@gmail.com',
                status: true,
                bloqued: false,
                roleId: 'read',
            },
            {
                name: 'Daemon Percival',
                lastname: 'Route Lars',
                email: 'daemonP@gmail.com',
                status: true,
                bloqued: true,
                roleId: 'write',
            },
            {
                name: 'Marie Linz',
                lastname: 'Per Toick',
                email: 'marLinz@gmail.com',
                status: false,
                bloqued: false,
                roleId: 'read',
            },
        ];

        // Get the contacts
        this.contacts$ = this._contactsService.contacts$;
        this._contactsService.contacts$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((contacts: Contact[]) => {
                // Update the counts

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                switchMap((query) =>
                    // Search
                    this._contactsService.searchContacts(query)
                )
            )
            .subscribe();
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
     * Open modal laguanges detail
     *
     * @param data
     */
    openDetailsModal(data?: any): void {
        this._modalSvc.openModal<UsersDetailsComponent, any>(
            UsersDetailsComponent,
            data
        );
    }
}
