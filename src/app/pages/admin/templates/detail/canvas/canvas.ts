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
import { PreviewModeT } from 'app/core/interfaces/page.interface';
import { ElementCMSI } from 'app/shared/interfaces/element.interface';
import { SelectedItemsInGridI } from 'app/shared/interfaces/grid.interface';
import { DialogService } from 'app/core/services/dialog.service';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { LanguageService } from 'app/shared/services/language.service';
import { CanvasService } from 'app/core/services/canvas.service';
import { PageService } from 'app/core/services/pages.service';
import { ParameterService } from 'app/core/services/parameter.service';
import { DynamicStyleService } from 'app/core/services/dynamic-style.service';
import { filterPath, validGrid } from 'app/shared/utils/grid.utils';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { TooltipDirective } from 'app/shared/directives/tooltip.directive';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { GridComponent } from 'app/shared/components/grid/grid';
import { LayerComponent } from 'app/shared/components/layer/layer';
import { InspectorComponent } from 'app/shared/components/inspector/inspector';
import { filter, interval, take } from 'rxjs';
import { TemplateService } from 'app/core/services/templates.service';
import { TemplateI } from 'app/core/interfaces/template.interface';

@Component({
  selector: 'templates-canvas',
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
export class TemplatesCanvas implements AfterViewInit, OnDestroy {
  private readonly languageSelect = viewChild.required<NgSelectComponent>('languageSelect');
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

  initialized = false;
  readonly permission = PermissionCode;

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _router = inject(Router);
  private readonly _parameterService = inject(ParameterService);
  private readonly _dialogService = inject(DialogService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _templateService = inject(TemplateService);
  private readonly _pageService = inject(PageService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _languageService = inject(LanguageService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _dynamicStyleService = inject(DynamicStyleService);

  readonly template = toSignal(this._templateService.template$, { initialValue: null });
  readonly selectedItemsInGrid = toSignal(this._pageService.selectedItemsInGrid$, {
    initialValue: null,
  });
  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });
  readonly micrositie = toSignal(this._microsityService.micrositie$, { initialValue: null });
  readonly languages = toSignal(this._languageService.languages$, {
    initialValue: { records: [], total: 0, page: 0, totalPage: 0 },
  });

  readonly canRedo = computed(() => this._canvasService.canRedo());
  readonly canUndo = computed(() => this._canvasService.canUndo());
  readonly activeLanguages = computed(() => this.languages().records.filter((lang) => lang.status));
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
    if (!backgroundImage && backgroundImage !== '' && backgroundImage !== 'null') {
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
    if (!backgroundImage && backgroundImage !== '' && backgroundImage !== 'null') {
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
    this._pageService.page = {
      name: 'preview',
      data: {
        body: {
          data: [],
          css: '',
          config: {},
        },
      },
    };
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
      const template = this.template();

      if (!template || this.initialized) {
        return;
      }

      this.updateSelectionItem({
        page: null,
        section: null,
        row: null,
        column: null,
        element: null,
        canvas: 'header',
      });

      this.initialized = true;

      if (this.originTemplate() === null) {
        this.originTemplate.set(structuredClone(template));
      }

      this.loadTemplateData();
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
    this._dynamicStyleService.remove('template-dynamicStyles');
    this.updateSelectionItem({
      page: null,
      section: null,
      column: null,
      row: null,
      element: null,
      canvas: 'header',
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Load template data from the server and update the component properties accordingly.
   */
  loadTemplateData() {
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

    const template = this.template();
    if (!template) {
      return;
    }

    // Disable the save action
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
    // Open the confirmation dialog
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Editar plantilla`,
      message: `¿Estas seguro/a que deseas editar la plantilla? esta acción no se puede deshacer.`,
      confirmButton: 'Si, Editar',
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();

    // Subscribe to the confirmation dialog closed action
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
    // Return if the grid is invalid
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

    // Disable the save action
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
   * Load styles
   */
  loadStyles() {
    const template = this.template();
    if (!template) return;
    const templateData = template.data;
    const css = `${templateData!.header.css} ${templateData!.footer.css}`;
    this._dynamicStyleService.remove('template-dynamicStyles');
    this._dynamicStyleService.set('template-dynamicStyles', css ?? '');
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
    this._router.navigateByUrl('/admin/content/templates/detail', {
      state: {
        id: this.template() === null ? 0 : this.template()!.id,
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

    this._dialogService.actionClick$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        const template = this.template();
        if (!template) {
          return;
        }
        if (result) {
          const draftTemplate: TemplateI = {
            ...template,
            data: structuredClone(template.draft!),
            draft: null!,
          };
          this._templateService.template = structuredClone(draftTemplate);
        } else {
          this.deleteDraft();
        }
        this.loadTemplateData();
      });
  }

  /**
   * Delete template draft
   */
  deleteDraft() {
    // Disable the save action
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
          const template = this.originTemplate();
          if (!template) {
            return;
          }
          this.deleteDraft();
          this._templateService.template = structuredClone({ ...template, draft: null! });
          this.loadTemplateData();
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
    this._pageService.selectedItemsInGrid = selectedItemsInGrid;
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
