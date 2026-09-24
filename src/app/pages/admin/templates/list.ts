import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { TemplateService } from 'app/core/services/templates.service';
import { PaginationComponent } from 'app/shared/components/pagination/pagination';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PaginationResquestI } from 'app/shared/interfaces/response.interface';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { TitleHeaderComponent } from 'app/shared/components/title-header/title-header';
import { TemplateI } from 'app/core/interfaces/template.interface';
import { Subject, takeUntil, debounceTime } from 'rxjs';

@Component({
  selector: 'templates-list',
  templateUrl: './list.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    PaginationComponent,
    PermissionComponent,
    NgClass,
    TitleHeaderComponent,
  ],
})
export class TemplatesList implements OnInit, OnDestroy {
  limit = signal<number>(10);

  searchInputControl: UntypedFormControl = new UntypedFormControl();
  statusControl: FormControl<boolean | null> = new FormControl(null);

  permission = PermissionCode;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _templateService = inject(TemplateService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _router = inject(Router);

  readonly templates = toSignal(this._templateService.templates$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  readonly totalTemplates = computed(() => this.templates().total);

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
        if (search) this.getAll(1, search === '' ? null : search, this.statusControl.value);
      });

    this.statusControl.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((status: boolean | null) => {
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
    this._templateService
      .getAll(params)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        error: (response) => {
          this._toastrService.error(response.error.message, 'Aviso');
        },
      });
  }

  /**
   * Open detail page
   *
   * @param data
   */

  openDetailsModal(template: TemplateI | null): void {
    this._templateService.template = null;
    this._router.navigateByUrl('/admin/content/templates/detail', {
      state: {
        id: template === null ? 0 : template.id,
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
    this.getAll(
      page,
      this.searchInputControl.value === '' ? null : this.searchInputControl.value,
      this.statusControl.value,
    );
  }

  /**
   * On limit change
   * @param limit
   */
  onLimitChange(limit: number): void {
    this.limit.set(limit);
    this.getAll(
      1,
      this.searchInputControl.value === '' ? null : this.searchInputControl.value,
      this.statusControl.value,
    );
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.searchInputControl.reset();
    this.getAll(1, null, this.statusControl.value);
  }

  /**
   * Change status
   * @param status
   */
  onChangeStatus(status: boolean | null) {
    this.statusControl.setValue(status);
  }
}
