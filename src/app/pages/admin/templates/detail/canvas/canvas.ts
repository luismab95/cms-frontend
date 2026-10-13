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
import { PreviewModeT, TemplateI } from '@core/interfaces';
import {
  ParameterService,
  DialogService,
  MicrosityService,
  TemplateService,
  PageService,
  CanvasService,
} from '@core/services';
import {
  PermissionComponent,
  GridComponent,
  LayerComponent,
  InspectorComponent,
  ToolbarCanvasComponent,
  DisabledCanvasComponent,
} from '@shared/components';
import { SelectedItemsInGridI, ElementCMSI } from '@shared/interfaces';
import { PermissionCode, findParameter, filterPath, validGrid, validAction } from '@shared/utils';
import { filter, interval, take } from 'rxjs';

@Component({
  selector: 'templates-canvas',
  templateUrl: './canvas.html',
  imports: [
    NgClass,
    PermissionComponent,
    GridComponent,
    LayerComponent,
    InspectorComponent,
    ToolbarCanvasComponent,
    DisabledCanvasComponent,
  ],
})
export class TemplatesCanvas implements AfterViewInit, OnDestroy {
  private readonly gridHeader = viewChild.required<GridComponent>('gridHeader');
  private readonly gridFooter = viewChild.required<GridComponent>('gridFooter');
  private readonly container = viewChild<ElementRef<HTMLElement>>('canvas');
  private readonly layer = viewChild.required<LayerComponent>('layer');

  preview = signal<PreviewModeT>('desktop');
  previewMode = signal<boolean>(false);
  autosave = signal<boolean>(false);
  saveAction = signal<boolean>(false);
  enabledCanvas = signal<boolean>(true);
  languageId = signal<number>(0);
  originTemplate = signal<TemplateI | null>(null);
  initialized = signal<boolean>(false);

  private readonly _parameterService = inject(ParameterService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _templateService = inject(TemplateService);
  private readonly _pageService = inject(PageService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _dialogService = inject(DialogService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly template = this._templateService.template;
  readonly parameters = this._parameterService.publicParameters;
  readonly micrositie = this._microsityService.micrositie;
  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

  readonly canRedo = computed(() => this._canvasService.canRedo());
  readonly canUndo = computed(() => this._canvasService.canUndo());
  readonly urlStatics = computed(
    () => findParameter('APP_STATICS_URL', this.parameters())?.value ?? '',
  );
  readonly headerStyles = computed(() => {
    const template = this.template();
    if (!template) {
      return {};
    }
    const pageData = template.data;
    const backgroundImage = pageData?.header.config?.['backgroundImage'];
    if (!backgroundImage || backgroundImage === '' || backgroundImage === 'null') {
      return {};
    }
    return {
      'background-image': `url('${this.urlStatics()}/${filterPath(backgroundImage)}')`,
    };
  });
  readonly footerStyles = computed(() => {
    const template = this.template();
    if (!template) {
      return {};
    }
    const pageData = template.data;
    const backgroundImage = pageData?.footer.config?.['backgroundImage'];
    if (!backgroundImage || backgroundImage === '' || backgroundImage === 'null') {
      return {};
    }
    return {
      'background-image': `url('${this.urlStatics()}/${filterPath(backgroundImage)}')`,
    };
  });
  readonly headerElementsConfig = computed(() => {
    const template = this.template();
    if (!template) {
      return { css: '', config: {} };
    }
    return { css: template.data!.header.css, config: template.data!.header.config };
  });
  readonly footerElementsConfig = computed(() => {
    const template = this.template();
    if (!template) {
      return { css: '', config: {} };
    }
    return { css: template.data!.footer.css, config: template.data!.footer.config };
  });

  /**
   * Constructor
   */
  constructor() {
    this._pageService.page.set(null);
    interval(300_000)
      .pipe(
        filter(() => !this.previewMode()),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => {
        this.updateDraft();
      });

    effect(() => {
      const template = this.template();
      if (!template || this.initialized()) return;

      this.updateSelectionItem({
        page: null,
        section: null,
        row: null,
        column: null,
        element: null,
        canvas: 'header',
      });

      this.initialized.set(true);
      if (this.originTemplate() === null) this.originTemplate.set(structuredClone(template));

      if (template.draft !== null) {
        this.confirmDraft();
        return;
      }
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
      canvas: 'header',
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

    const template = this.template();
    if (!template) return;

    this.saveAction.set(true);
    this.autosave.set(true);

    const data = {
      ...template.data!,
      header: {
        ...template.data!.header,
        data: template.data?.header.data!,
      },
      footer: {
        ...template.data!.footer,
        data: template.data?.footer.data!,
      },
    };

    this._templateService
      .saveDraft(template.id!, {
        name: template.name,
        description: template.description,
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
            response.error?.message || 'No fue posible guardar cambios borrador de la plantilla.',
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
      title: `Editar plantilla`,
      message: `¿Estas seguro/a que deseas editar la plantilla? esta acción no se puede deshacer.`,
      confirmButton: 'Si, Editar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();
    this._dialogService.actionClick$
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          this.updateTemplate();
        }
      });
  }

  /**
   * Update page
   */
  updateTemplate() {
    if (!validGrid(this.template()?.data?.header.data!)) {
      this._toastrService.warning(
        'Hay elementos en el encabezado que aún no están configurados. Completa su configuración antes de continuar.',
        'Configuración pendiente',
      );
      return;
    }

    if (!validGrid(this.template()?.data?.footer.data!)) {
      this._toastrService.warning(
        'Hay elementos en el pie de página que aún no están configurados. Completa su configuración antes de continuar.',
        'Configuración pendiente',
      );
      return;
    }

    this.saveAction.set(true);

    const template = this.template();
    if (template == null) return;

    const data = {
      ...template.data!,
      header: {
        ...template.data!.header,
        data: template.data?.header.data!,
      },
      footer: {
        ...template.data!.footer,
        data: template.data?.footer.data!,
      },
    };

    this._templateService
      .update(template.id!, {
        name: template.name,
        description: template.description,
        data,
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
          this._toastrService.success(
            'El diseño de la plantilla se actualizó correctamente.',
            'Cambios guardados',
          );
        },
        error: (response) => {
          this.saveAction.set(false);
          this._toastrService.error(
            response.error?.message ||
              'No fue posible guardar los cambios de diseño de la plantilla.',
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
   */
  goToBack() {
    this._router.navigateByUrl('/admin/content/templates/detail', {
      state: {
        id: this.template() === null ? 0 : this.template()!.id,
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
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        const template = this.template();
        if (!template) return;
        if (result) {
          const draftTemplate: TemplateI = {
            ...template,
            data: structuredClone(template.draft!),
            draft: null!,
          };
          this._templateService.template.set(structuredClone(draftTemplate));
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

    const template = this.template();
    if (template == null) return;

    this._templateService
      .deleteDraft(template.id!)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.saveAction.set(false);
        },
        error: (response) => {
          this.saveAction.set(false);
          this._toastrService.error(
            response.error?.message ||
              'No fue posible descartar los cambios de diseño de la plantilla.',
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
          const template = this.originTemplate();
          if (!template) return;

          this.deleteDraft();
          this._templateService.template.set(structuredClone({ ...template, draft: null! }));
          this.updateSelectionItem({
            page: null,
            section: null,
            row: null,
            column: null,
            element: null,
            canvas: 'header',
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
    this.gridHeader().undo();
  }

  /**
   * Redo changes
   */
  redo() {
    this.gridHeader().redo();
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
    const gridType = this.selectedItemsInGrid()?.canvas;
    if (!gridType) return;
    if (gridType === 'header') this.gridHeader().addElement(element);
    if (gridType === 'footer') this.gridFooter().addElement(element);
  }
}
