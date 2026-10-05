import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TitleCasePipe, UpperCasePipe, NgClass } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { ParameterService } from '@core/services';
import { PermissionComponent, PaginationComponent } from '@shared/components';
import { LanguageI, PaginationResquestI, TableSearchI } from '@shared/interfaces';
import { LanguageService } from '@shared/services';
import { PermissionCode, findParameter, validAction } from '@shared/utils';
import { SitieLanguagesDetailsComponent } from './details/details';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'sitie-languages',
  templateUrl: './languages.html',
  imports: [
    TitleCasePipe,
    UpperCasePipe,
    PermissionComponent,
    PaginationComponent,
    SitieLanguagesDetailsComponent,
    NgClass,
    FormField,
  ],
})
export class SitieLanguagesComponent {
  urlStatics = signal<string>('');
  limit = signal<number>(10);
  showDetails = signal<boolean>(false);
  selectedLanguage = signal<LanguageI | null>(null);
  tableSearchModel = signal<TableSearchI>({
    search: '',
    status: null,
  });

  tableSearchForm = form(this.tableSearchModel);

  private readonly _parameterService = inject(ParameterService);
  private readonly _languageService = inject(LanguageService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly parameters = this._parameterService.publicParameters;
  readonly languages = this._languageService.languages;

  readonly totalLanguage = computed(() => this.languages().total);

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const parameters = this.parameters();
      this.urlStatics.set(findParameter('APP_STATICS_URL', parameters)!.value);
    });

    toObservable(this.tableSearchForm.search().value)
      .pipe(debounceTime(600), takeUntilDestroyed(this._destroyRef))
      .subscribe((search) => {
        if (search) this.getAll(1, search === '' ? null : search, this.tableSearchModel().status);
      });

    toObservable(this.tableSearchForm.status().value)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((status) => {
        this.getAll(
          1,
          this.tableSearchModel().search === '' ? null : this.tableSearchModel().search,
          status,
        );
      });
  }

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
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        error: (response) => {
          this._toastrService.error(response.error.message, 'Aviso');
        },
      });
  }

  /**
   * Open modal laguanges detail
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
    this.tableSearchModel.update((prev) => ({ ...prev, search: '' }));
    this.getAll(1, null, this.tableSearchModel().status);
  }

  /**
   * On Page change
   * @param page
   */
  onPageChange(page: number): void {
    this.getAll(
      page,
      this.tableSearchModel().search === '' ? null : this.tableSearchModel().search,
      this.tableSearchModel().status,
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
      this.tableSearchModel().search === '' ? null : this.tableSearchModel().search,
      this.tableSearchModel().status,
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
    this.tableSearchModel.update((prev) => ({ ...prev, status }));
    this.onPageChange(1);
  }
}
