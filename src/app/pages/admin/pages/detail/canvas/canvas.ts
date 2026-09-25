import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, UpperCasePipe } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { NgLabelTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { PageI, PreviewModeT } from 'app/core/interfaces/page.interface';
import { DialogService } from 'app/core/services/dialog.service';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { LanguageService } from 'app/shared/services/language.service';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { PageService } from 'app/core/services/pages.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { DynamicStyleService } from 'app/core/services/dynamic-style.service';
import { SectionI, SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';
import {
  findColumnByUuid,
  findElementByUuid,
  findRowByUuid,
  findSectionByUuid,
  validGrid,
} from 'app/shared/utils/grid.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { GridComponent } from 'app/shared/components/grid/grid';
import { LayerComponent } from 'app/shared/components/layer/layer';
import { InspectorComponent } from 'app/shared/components/inspector/inspector';
import { filter, interval, take } from 'rxjs';

@Component({
  selector: 'pages-canvas',
  templateUrl: './canvas.html',
  imports: [
    FormsModule,
    PermissionComponent,
    NgClass,
    UpperCasePipe,
    NgSelectComponent,
    NgLabelTemplateDirective,
    GridComponent,
    TooltipDirective,
    LayerComponent,
    InspectorComponent,
  ],
})
export class PagesCanvas implements AfterViewInit, OnDestroy {
  private readonly languageSelect = viewChild.required<NgSelectComponent>('languageSelect');
  private readonly container = viewChild<ElementRef<HTMLElement>>('canvas');

  preview = signal<PreviewModeT>('desktop');
  previewMode = signal<boolean>(false);
  reviewChanges = signal<boolean>(false);
  autosave = signal<boolean>(false);
  saveAction = signal<boolean>(false);
  enabledCanvas = signal<boolean>(true);
  languageId = signal<number>(0);
  originPage = signal<PageI | null>(null);

  readonly permission = PermissionCode;
  private initialized = false;

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);
  private readonly _parameterService = inject(ParameterService);
  private readonly _dialogService = inject(DialogService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _pageService = inject(PageService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _languageService = inject(LanguageService);
  private readonly _historyService = inject(HistoryService);
  private readonly _dynamicStyleService = inject(DynamicStyleService);

  readonly page = toSignal(this._pageService.page$, { initialValue: null });
  readonly selectedItemsInGrid = toSignal(this._pageService.selectedItemsInGrid$, {
    initialValue: null,
  });
  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });
  readonly micrositie = toSignal(this._microsityService.micrositie$, { initialValue: null });
  readonly languages = toSignal(this._languageService.languages$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });
  readonly body = this._pageService.sections;

  readonly canRedo = computed(() => this._historyService.canRedo.body());
  readonly canUndo = computed(() => this._historyService.canUndo.body());
  readonly activeLanguages = computed(() => this.languages().records.filter((lang) => lang.status));
  readonly urlStatics = computed(
    () => findParameter('APP_STATICS_URL', this.parameters())?.value ?? '',
  );
  readonly bodyStyles = computed(() => {
    const page = this.page();
    if (!page) {
      return {};
    }
    const pageData = this.reviewChanges() ? page.dataReview : page.data;
    const backgroundImage = pageData?.body.config?.['backgroundImage'];
    if (!backgroundImage) {
      return {};
    }
    return {
      'background-image': `url('${this.urlStatics()}/${backgroundImage}')`,
    };
  });

  /**
   * Constructor
   */
  constructor() {
    this._pageService.sections = [];
    this._pageService.sectionsHeader = [];
    this._pageService.sectionsFooter = [];

    interval(300_000)
      .pipe(
        filter(() => !this.previewMode()),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => {
        this.updateDraft();
      });

    effect(() => {
      const languages = this.activeLanguages();
      if (this.languageId() === 0 && languages.length > 0) {
        this.languageId.set(languages[0].id!);
      }
    });

    effect(() => {
      const page = this.page();

      if (!page || this.initialized) {
        return;
      }

      this.initialized = true;

      if (this.originPage() === null) {
        this.originPage.set(structuredClone(page));
      }

      this.reviewChanges.set(!!page.lastChangeReject);

      if (page.review) {
        this.previewMode.set(true);
      }

      if (page.draft !== null) {
        this.confirmDraft();
        return;
      }
      this.loadPageData();
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * AfterViewInit
   * @returns
   */
  ngAfterViewInit() {
    const element = this.container()?.nativeElement;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      if (width < 1024) {
        this.enabledCanvas.set(false);
      } else {
        this.enabledCanvas.set(true);
      }
    });

    observer.observe(element);
    this._destroyRef.onDestroy(() => {
      observer.disconnect();
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    this._dynamicStyleService.remove('body-dynamicStyles');
    this.updateSelectionItem({
      section: null,
      column: null,
      row: null,
      element: null,
      canvas: 'body',
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Load template data from the server and update the component properties accordingly.
   */
  loadPageData() {
    this.loadGridData();
    this.loadStyles();
  }

  /**
   * Update draft page
   */
  updateDraft() {
    if (this.previewMode()) return;

    if (
      !this.validPermission(this.permission.editContentPage) &&
      !this.validPermission(this.permission.editDesignPage)
    )
      return;

    const page = this.page();
    if (!page || page.review) {
      return;
    }

    // Disable the save action
    this.saveAction.set(true);
    this.autosave.set(true);

    const data = {
      ...page.data!,
      body: {
        ...page.data!.body,
        data: this.body(),
      },
    };

    this._pageService
      .saveDraft(page.id!, {
        name: page.name,
        data,
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
          this.autosave.set(false);
          this._toastrService.success(
            'Tus cambios se guardaron automáticamente como borrador.',
            'Borrador actualizado',
          );
        },
        error: (response) => {
          this.saveAction.set(false);
          this.autosave.set(false);
          this._toastrService.error(
            response.error?.message || 'No fue posible guardar cambios borrador de la página.',
            'Error al guardar',
          );
        },
      });
  }

  /**
   *  Confirm update page
   */
  confirmUpdatePage() {
    // Open the confirmation dialog
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Editar página`,
      message: `¿Estas seguro/a que deseas editar la página? No podras volver a editar la página hasta que los cambios sean aprobados por un revisor.`,
      confirmButton: 'Si, Enviar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();

    // Subscribe to the confirmation dialog closed action
    this._dialogService.actionClick$
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          this.updatePage();
        }
      });
  }

  /**
   * Update page
   */
  updatePage() {
    // Return if the grid is invalid
    if (!validGrid(this.body())) {
      this._toastrService.warning('Termina de configurar el contenido de la página.', 'Aviso');
      return;
    }

    // Disable the save action
    this.saveAction.set(true);

    const page = this.page();
    if (page == null) return;

    const pageData = this.reviewChanges() ? page.dataReview : page.data;

    this._pageService
      .update(page.id!, {
        name: page.name,
        data: {
          body: {
            data: this.body(),
            css: pageData!.body.css,
            config: pageData!.body.config,
          },
        },
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
          this._toastrService.success(
            'El diseño de la página se actualizó correctamente.',
            'Cambios guardados',
          );
        },
        error: (response) => {
          this.saveAction.set(false);
          this._toastrService.error(
            response.error?.message || 'No fue posible guardar los cambios de diseño de la página.',
            'Error al guardar',
          );
        },
      });
  }

  /**
   * Load data
   */
  loadGridData() {
    const pageData = this.reviewChanges() ? this.page()!.dataReview : this.page()!.data;
    if (!pageData) return;
    this._pageService.sections = structuredClone(pageData.body.data);
  }

  /**
   * Load styles
   */
  loadStyles() {
    const page = this.page();
    if (!page) return;
    const pageData = this.reviewChanges() ? page.dataReview : page.data;
    this._dynamicStyleService.set('body-dynamicStyles', pageData?.body.css ?? '');
  }

  /**
   * Set preview mode
   * @param mode
   */
  setPreviewMode(mode: PreviewModeT) {
    this.preview.set(mode);
  }

  /**
   * Toggle preview mode
   */
  togglePreviewMode() {
    this.previewMode.update((preview) => !preview);
  }

  /**
   * Ir atras
   *
   */
  goToBack() {
    const page = this.page();
    this._pageService.page = null;
    this._router.navigateByUrl('/admin/content/pages/detail', {
      state: {
        id: page === null ? 0 : page!.id,
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
   *  Choose load data draft
   */
  confirmDraft() {
    // Open the confirmation dialog
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Cambios sin guardar`,
      message: `Tienes cambios sin guardar en borrador, ¿Deseas seguir editando?.`,
      confirmButton: 'Si, Editar',
      cancelButton: 'Descartar cambios',
    });

    this._dialogService.toggleDialog();

    // Subscribe to the confirmation dialog closed action
    this._dialogService.actionClick$
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        const page = this.page();
        if (!page) {
          return;
        }
        if (result) {
          const draftPage: PageI = {
            ...page,
            data: structuredClone(page.draft!),
            draft: null!,
          };
          this._pageService.page = structuredClone(draftPage);
        } else {
          this.deleteDraft();
        }
        this.loadPageData();
      });
  }

  /**
   * Delete template draft
   */
  deleteDraft() {
    // Disable the save action
    this.saveAction.set(true);

    const page = this.page();
    if (page == null) return;

    this._pageService
      .deleteDraft(page.id!)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
        },
        error: (response) => {
          this.saveAction.set(false);
          this._toastrService.error(
            response.error?.message ||
              'No fue posible descartar los cambios de diseño de la página.',
            'Error al descartar',
          );
        },
      });
  }

  /**
   * Set language
   * @param id
   */
  setLanguageId(id: number) {
    this.languageId.set(id);
  }

  /**
   * Open language select
   */
  openLanguageSelect() {
    this.languageSelect().open();
  }

  /**
   * revert changes
   */
  cancel() {
    // Open the confirmation dialog
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Descartar cambios`,
      message: `¿Estas seguro/a que deseas descartar estos cambios?. Esta acción no se puede deshacer.`,
      confirmButton: 'Si, Descartar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();

    // Subscribe to the confirmation dialog closed action
    this._dialogService.actionClick$
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          const page = this.originPage();
          if (!page) {
            return;
          }
          this.deleteDraft();
          this._pageService.page = structuredClone({ ...page, draft: null! });
          this.loadPageData();
          this.updateSelectionItem({
            section: null,
            row: null,
            column: null,
            element: null,
            canvas: 'body',
          });
          this._historyService.clearAll();
        }
      });
  }

  /**
   * Selected items
   * @param selectedItemsInGrid
   */
  updateSelectionItem(selectedItemsInGrid: SelectedItemsInGridI) {
    this._pageService.selectedItemsInGrid = selectedItemsInGrid;
  }

  /**
   * Undo Changes
   */
  undo() {
    const state = this._historyService.undo('body');
    if (state) {
      this._pageService.sections = state;
      this.refreshSelectedItemsInGrid(state);
    }
  }

  /**
   * Redo changes
   */
  redo() {
    const state = this._historyService.redo('body');
    if (state) {
      this._pageService.sections = state;
      this.refreshSelectedItemsInGrid(state);
    }
  }

  /**
   * Refresh selections
   */
  refreshSelectedItemsInGrid(state: SectionI[]) {
    const selectedItemsInGrid = this.selectedItemsInGrid();

    if (selectedItemsInGrid === null) return;
    this.updateSelectionItem({
      section: findSectionByUuid(state, selectedItemsInGrid?.section?.uuid ?? ''),
      row: findRowByUuid(state, selectedItemsInGrid?.row?.uuid ?? ''),
      column: findColumnByUuid(state, selectedItemsInGrid?.column?.uuid ?? ''),
      element: findElementByUuid(state, selectedItemsInGrid?.element?.uuid ?? ''),
      canvas: 'body',
    });
  }
}
