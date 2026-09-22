import { TitleCasePipe, UpperCasePipe, NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterService } from 'app/core/services/parameter.service';
import { PaginationComponent } from 'app/shared/components/pagination/pagination';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { LanguageI } from 'app/shared/interfaces/language.interfaces';
import { PaginationResquestI } from 'app/shared/interfaces/response.interface';
import { LanguageService } from 'app/shared/services/language.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { SitieLanguagesDetailsComponent } from './details/details';

@Component({
  selector: 'sitie-languages',
  templateUrl: './languages.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TitleCasePipe,
    UpperCasePipe,
    PermissionComponent,
    PaginationComponent,
    SitieLanguagesDetailsComponent,
    NgClass,
  ],
})
export class SitieLanguagesComponent implements OnInit {
  permission = PermissionCode;
  searchInputControl: UntypedFormControl = new UntypedFormControl();
  statusControl: FormControl<boolean | null> = new FormControl(null);

  urlStatics = signal<string>('');
  limit = signal<number>(10);
  showDetails = signal<boolean>(false);
  selectedLanguage = signal<LanguageI | null>(null);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _parameterService = inject(ParameterService);
  private _languageService = inject(LanguageService);
  private _toastrService = inject(ToastrService);

  readonly parameters = toSignal(this._parameterService.parameter$, {
    initialValue: [],
  });
  readonly languages = toSignal(this._languageService.languages$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  readonly totalLanguage = computed(() => this.languages().total);

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
    // Get the languages
    this.urlStatics.set(findParameter('APP_STATICS_URL', this.parameters())!.value);

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
    this._languageService
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
  openDetailsModal(language: LanguageI | null): void {
    this.selectedLanguage.set(language);
    this.showDetails.set(true);
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
    return `${this.urlStatics()}/${icon}`;
  }

  /**
   * Clear input search
   */
  clearSearch() {
    this.searchInputControl.reset();
    this.getAll(1, null, this.statusControl.value);
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
   * Close modal
   */
  closeModal(load: boolean) {
    this.selectedLanguage.set(null);
    this.showDetails.set(false);
    if (load) this.onChangeStatus(null);
  }

  /**
   * Change status
   * @param status
   */
  onChangeStatus(status: boolean | null) {
    this.statusControl.setValue(status);
  }
}
