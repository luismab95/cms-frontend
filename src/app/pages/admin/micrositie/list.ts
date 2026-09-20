import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { PaginationComponent } from 'app/shared/components/pagination/pagination';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PaginationResquestI } from 'app/shared/interfaces/response.interface';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { NgSelectComponent } from '@ng-select/ng-select';
import { MicrositieI } from 'app/core/interfaces/micrositie.interface';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { Router } from '@angular/router';

@Component({
  selector: 'microsities-list',
  templateUrl: './list.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    PermissionComponent,
    NgSelectComponent,
    NgClass,
  ],
})
export class MicrositieList implements OnInit, OnDestroy {
  limit = signal<number>(10);
  selectedMicrositie = signal<MicrositieI | null>(null);

  searchInputControl: UntypedFormControl = new UntypedFormControl();
  statusControl: FormControl = new FormControl(0);

  permission = PermissionCode;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _microsityService = inject(MicrosityService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _router = inject(Router);

  readonly microsities = toSignal(this._microsityService.microsities$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  readonly totalMicrosities = computed(() => this.microsities().total);

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
    const params: PaginationResquestI = {
      page,
      limit: this.limit(),
      search,
      status,
    };
    this._microsityService
      .getAll(params)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        error: (response) => {
          this._toastrService.error(response.error.message, 'Aviso');
        },
      });
  }

  /**
   * Open modal micrositie detail
   *
   * @param data
   */
  openDetailsModal(micrositie: MicrositieI | null): void {
    this._router.navigateByUrl('/admin/content/microsities/detail', {
      state: {
        micrositieId: micrositie?.id ?? 0,
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

  /**
   * Close modal
   */
  closeModal(load: boolean) {
    this.selectedMicrositie.set(null);
    if (load) this.getAll(1, null, null);
  }
}
