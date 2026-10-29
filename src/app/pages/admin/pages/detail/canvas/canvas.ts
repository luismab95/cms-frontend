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
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { PreviewModeT, PageI, PageDataMongoI } from '@core/interfaces';
import {
  ParameterService,
  DialogService,
  MicrosityService,
  TemplateService,
  PageService,
  CanvasService,
  UserService,
} from '@core/services';
import {
  PermissionComponent,
  GridComponent,
  LayerComponent,
  InspectorComponent,
  ToolbarCanvasComponent,
  DisabledCanvasComponent,
  ReviewModeComponent,
} from '@shared/components';
import { SelectedItemsInGridI, ElementCMSI } from '@shared/interfaces';
import { PermissionCode, findParameter, filterPath, validGrid, validAction } from '@shared/utils';
import { filter, interval, take } from 'rxjs';

@Component({
  selector: 'pages-canvas',
  templateUrl: './canvas.html',
  imports: [
    NgClass,
    PermissionComponent,
    GridComponent,
    LayerComponent,
    InspectorComponent,
    ToolbarCanvasComponent,
    DisabledCanvasComponent,
    ReviewModeComponent,
  ],
})
export class PagesCanvas implements AfterViewInit, OnDestroy {
  private readonly grid = viewChild.required<GridComponent>('grid');
  private readonly container = viewChild<ElementRef<HTMLElement>>('canvas');
  private readonly layer = viewChild.required<LayerComponent>('layer');

  preview = signal<PreviewModeT>('desktop');
  previewMode = signal<boolean>(false);
  reviewChanges = signal<boolean>(false);
  reviewRejectChanges = signal<boolean>(false);
  autosave = signal<boolean>(false);
  saveAction = signal<boolean>(false);
  enabledCanvas = signal<boolean>(true);
  languageId = signal<number>(0);
  originPage = signal<PageI | null>(null);
  initialized = signal<boolean>(false);

  private readonly _parameterService = inject(ParameterService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _templateService = inject(TemplateService);
  private readonly _pageService = inject(PageService);
  private readonly _userService = inject(UserService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _dialogService = inject(DialogService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);

  readonly permission = PermissionCode;
  readonly page = this._pageService.page;
  readonly parameters = this._parameterService.publicParameters;
  readonly micrositie = this._microsityService.micrositie;
  readonly userLogin = this._userService.userLogin;

  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

  readonly canRedo = computed(() => this._canvasService.canRedo());
  readonly canUndo = computed(() => this._canvasService.canUndo());
  readonly urlStatics = computed(
    () => findParameter('APP_STATICS_URL', this.parameters())?.value ?? '',
  );
  readonly bodyStyles = computed(() => {
    const page = this.page();
    if (!page) {
      return {};
    }
    const pageData = (
      this.reviewChanges() ? page.reviewPage?.data?.dataReview : page.data
    ) as PageDataMongoI;
    const backgroundImage = pageData.body.config['backgroundImage'];
    if (!backgroundImage || backgroundImage === '' || backgroundImage === 'null') {
      return {};
    }
    return {
      'background-image': `url('${this.urlStatics()}/${filterPath(backgroundImage)}')`,
    };
  });
  readonly pageElementsConfig = computed(() => {
    const page = this.page();
    if (!page) {
      return { css: '', config: {} };
    }
    const pageData = (
      this.reviewChanges() ? page.reviewPage?.data?.dataReview : page.data
    ) as PageDataMongoI;
    return { css: pageData.body.css, config: pageData.body.config };
  });

  /**
   * Constructor
   */
  constructor() {
    this._templateService.template.set(null);
    interval(300_000)
      .pipe(
        filter(() => !this.previewMode()),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => {
        this.updateDraft();
      });

    effect(() => {
      const page = this.page();

      if (!page || this.initialized()) {
        return;
      }

      if (this.originPage() === null) this.originPage.set(structuredClone(page));

      const review = page.reviewPage?.review;
      const statusReview = page.reviewPage?.data?.statusReview;
      if (review && statusReview !== 'rejected') {
        this.reviewChanges.set(true);
        this.previewMode.set(true);
        this.reviewRejectChanges.set(false);
      }

      if (review && statusReview === 'rejected') {
        this.reviewRejectChanges.set(true);
        if (page.reviewPage?.data?.userChangesId !== this.userLogin()?.id) {
          this.reviewChanges.set(true);
          this.previewMode.set(true);
          this.reviewRejectChanges.set(false);
        }
      }

      if (page.draft) this.confirmDraft();
      this.initialized.set(true);
    });
  }

  /**
   * AfterViewInit
   * @returns
   */
  ngAfterViewInit() {
    const element = this.container()?.nativeElement;
    if (!element) return;

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
    this.updateSelectionItem({
      page: null,
      section: null,
      column: null,
      row: null,
      element: null,
      canvas: 'page',
    });
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
    if (!page || this.reviewChanges()) {
      return;
    }

    this.saveAction.set(true);
    this.autosave.set(true);

    const data = {
      ...page.data!,
      body: {
        ...page.data!.body,
        data: page.data?.body.data!,
      },
    };

    this._pageService
      .saveDraft(page.id!, {
        name: page.name,
        path: page.path,
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
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Editar página`,
      message: `¿Estas seguro/a que deseas editar la página?. No podras volver a editar la página hasta que los cambios sean aprobados por un revisor.`,
      confirmButton: 'Si, Enviar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();
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
    if (!validGrid(this.page()?.data?.body.data!)) {
      this._toastrService.warning(
        'Hay elementos del contenido que aún no están configurados. Completa su configuración antes de continuar.',
        'Configuración pendiente',
      );
      return;
    }

    this.saveAction.set(true);

    const page = this.page();
    if (page == null) return;

    const pageData = page.data;

    this._pageService
      .update(page.id!, {
        name: page.name,
        path: page.path,
        data: {
          body: {
            data: page.data?.body.data!,
            css: pageData!.body.css,
            config: pageData!.body.config,
          },
        },
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._toastrService.success(
            'El diseño de la página se actualizó correctamente.',
            'Cambios guardados',
          );
          this.initialized.set(false);
          this.saveAction.set(false);
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
    this.preview.set('desktop');
    this.previewMode.update((preview) => !preview);
  }

  /**
   * Ir atras
   *
   */
  goToBack() {
    const page = this.page();
    this._pageService.page.set(null);
    this._router.navigateByUrl('/admin/content/pages/detail', {
      state: {
        id: page === null ? 0 : page!.id,
        micrositieId: this.micrositie() !== null ? this.micrositie()!.id : 0,
      },
    });
  }

  /**
   * Valid render permission
   * @param code
   * @returns
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   *  Choose load data draft
   */
  confirmDraft() {
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Cambios sin guardar`,
      message: `Tienes cambios sin guardar en borrador, ¿Deseas seguir editando?.`,
      confirmButton: 'Si, Editar',
      cancelButton: 'Descartar cambios',
    });

    this._dialogService.toggleDialog();
    this._dialogService.actionClick$
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        const page = this.page();
        if (!page) return;

        if (result) {
          const draftPage: PageI = {
            ...page,
            data: structuredClone(page.draft!),
            draft: null!,
          };
          this._pageService.page.set(structuredClone(draftPage));
        } else {
          this.deleteDraft();
        }
      });
  }

  /**
   * Delete template draft
   */
  deleteDraft() {
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
   * revert changes
   */
  cancel() {
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Descartar cambios`,
      message: `¿Estas seguro/a que deseas descartar estos cambios?. Esta acción no se puede deshacer.`,
      confirmButton: 'Si, Descartar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();
    this._dialogService.actionClick$
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          const page = this.originPage();
          if (!page) return;

          this.deleteDraft();
          this._pageService.page.set(structuredClone({ ...page, draft: null! }));
          this.updateSelectionItem({
            page: null,
            section: null,
            row: null,
            column: null,
            element: null,
            canvas: 'page',
          });
          this._canvasService.clear();
        }
      });
  }

  /**
   * Selected items
   * @param selectedItemsInGrid
   */
  updateSelectionItem(selectedItemsInGrid: SelectedItemsInGridI) {
    this._canvasService.selectedItemsInGrid.set(selectedItemsInGrid);
  }

  /**
   * Undo Changes
   */
  undo() {
    this.grid().undo();
  }

  /**
   * Redo changes
   */
  redo() {
    this.grid().redo();
  }

  /**
   * Open elements manager panel
   */
  openElementsPanel() {
    this.layer().isElementPanelOpen.set(true);
  }

  /**
   * Add element
   * @param element
   * @returns
   */
  addElement(element: ElementCMSI | null) {
    if (!element) return;
    this.grid().addElement(element);
  }
}
