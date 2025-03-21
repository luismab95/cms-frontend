import { AsyncPipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewEncapsulation,
    inject,
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
import { PaginationComponent } from 'app/shared/components/pagination/pagination.component';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import {
    PaginationResponseI,
    PaginationResquestI,
} from 'app/shared/interfaces/response.interface';
import { ModalService } from 'app/shared/services/modal.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';
import { LanguageI } from '../../../../shared/interfaces/language.types';
import { LanguageService } from '../../../../shared/services/language.service';
import { ParameterI } from '../../parameters/parameter.interface';
import { ParameterService } from '../../parameters/parameter.service';
import { SitieLanguagesDetailsComponent } from './details/details.component';

@Component({
    selector: 'sitie-languages',
    templateUrl: './languages.component.html',
    styles: [
        /* language=SCSS */
        `
            .languages-grid {
                grid-template-columns: 24px auto 24px;

                @screen sm {
                    grid-template-columns: 24px auto 24px;
                }

                @screen md {
                    grid-template-columns: 24px 112px auto 24px 24px;
                }

                @screen lg {
                    grid-template-columns: 24px 112px auto 80px 80px 24px 42px;
                }
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatButtonModule,
        MatPaginatorModule,
        TitleCasePipe,
        UpperCasePipe,
        PaginationComponent,
        AsyncPipe,
        PermissionComponent,
    ],
})
export class SitieLanguagesComponent implements OnInit {
    languagesCount: number = 0;
    languages$: Observable<PaginationResponseI<LanguageI[]>>;
    isLoading: boolean = false;
    urlStatics: string;
    permission = PermissionCode;
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _modalSvc: ModalService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _languageService: LanguageService,
        private _toastrService: ToastrService
    ) {
        this._parameterService.parameter$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((parameters: ParameterI[]) => {
                this.urlStatics = findParameter(
                    'APP_STATICS_URL',
                    parameters
                ).value;
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
        // Get the languages
        this.languages$ = this._languageService.languages$;
        this._languageService.languages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((languages) => {
                // Update the users
                this.languages$ = this._languageService.languages$;
                this.languagesCount = languages.total;
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
                        length: this.languagesCount,
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
        this._languageService
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
     * Open modal laguanges detail
     *
     * @param data
     */
    openDetailsModal(data?: LanguageI): void {
        const dialogRef = this._modalSvc.openModal<
            SitieLanguagesDetailsComponent,
            LanguageI
        >(SitieLanguagesDetailsComponent, data);

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.getAll({
                    pageSize: 10,
                    pageIndex: 0,
                    length: this.languagesCount,
                });
            }
        });
    }

    /**
     * Valid render permission
     */
    validPermission(code: string) {
        return validAction(code);
    }

    /**
     * Get icon
     * @returns
     */
    getICon(icon: string) {
        return `${this.urlStatics}/${icon}`;
    }
}
