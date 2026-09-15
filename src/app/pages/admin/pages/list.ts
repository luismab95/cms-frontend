import { NgClass } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { NgSelectComponent } from '@ng-select/ng-select';
import { PageI, PagePaginationResquestI } from 'app/core/interfaces/page.interface';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { PageService } from 'app/core/services/pages.service';
import { PaginationComponent } from 'app/shared/components/pagination/pagination';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'pages',
  templateUrl: './list.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    NgSelectComponent,
    PermissionComponent,
    NgClass,
  ],
})
export class PagesList implements OnInit, OnDestroy {
  limit = signal<number>(10);
  showDetails = signal<boolean>(false);
  selectedUser = signal<PageI | null>(null);

  searchInputControl: UntypedFormControl = new UntypedFormControl();
  statusControl: FormControl = new FormControl(0);

  permission = PermissionCode;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _pageService = inject(PageService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _router = inject(Router);
  private readonly _toastrService = inject(ToastrService);

  readonly pages = toSignal(this._pageService.pages$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });
  readonly micrositie = toSignal(this._microsityService.micrositie$, { initialValue: null });

  readonly totalPage = computed(() => this.pages().total);

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to search input field value changes
    this.searchInputControl.valueChanges
      .pipe(debounceTime(700), takeUntil(this._unsubscribeAll))
      .subscribe((search: string) => {
        if (search) this.getAll(1, search === '' ? null : search, null);
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((res: number) => {
        let status: boolean | null;
        switch (res) {
          case 1:
            status = true;
            break;
          case 2:
            status = false;
            break;
          default:
            status = null;
        }
        this.getAll(
          1,
          this.searchInputControl.value === '' ? null : this.searchInputControl.value,
          status,
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
  getAll(page: number, search: string | null = null, status: boolean | null = null) {
    const params: PagePaginationResquestI = {
      page,
      limit: this.limit(),
      micrositieId: null,
      search,
      status,
    };
    this._pageService
      .getAll(params)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        error: (response) => {
          this._toastrService.error(response.error.message, 'Aviso');
        },
      });
  }

  /**
   * Open modal laguanges detail
   *
   * @param data
   */
  openDetailsModal(page: PageI | null): void {
    this._pageService.page = null;
    this._router.navigateByUrl('/admin/content/pages/detail', {
      state: {
        id: page === null ? 0 : page.id,
        micrositieId: this.micrositie() !== null ? this.micrositie()!.id : 0,
      },
    });
  }

  /**
   * Valid render permission
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   * On Page change
   * @param page
   */
  onPageChange(page: number): void {
    this.getAll(page, null, null);
  }

  /**
   * On limit change
   * @param limit
   */
  onLimitChange(limit: number): void {
    this.limit.set(limit);
    this.getAll(1, null, null);
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.searchInputControl.reset();
    this.getAll(1, null, null);
  }
}
