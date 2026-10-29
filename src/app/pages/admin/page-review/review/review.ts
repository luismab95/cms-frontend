import { NgClass } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import {
  PageDataMongoI,
  PageI,
  PreviewModeT,
  ReviewCommentI,
  ReviewEntityI,
  ReviewModelI,
  TemplateDataMongoI,
  TemplateI,
} from '@core/interfaces';
import {
  CanvasService,
  DialogService,
  PageReviewService,
  PageService,
  ParameterService,
  TemplateService,
} from '@core/services';
import {
  DisabledCanvasComponent,
  GridReviewComponent,
  PermissionComponent,
  ToolbarReviewPagesComponent,
} from '@shared/components';
import { filterPath, findParameter, PermissionCode, validAction } from '@shared/utils';
import { take } from 'rxjs';
import { ReviewDetailComponent } from '../detail/detail';

@Component({
  selector: 'review-list',
  templateUrl: './review.html',
  imports: [
    DisabledCanvasComponent,
    PermissionComponent,
    NgClass,
    ToolbarReviewPagesComponent,
    ReviewDetailComponent,
    GridReviewComponent,
  ],
})
export class ReviewPage implements AfterViewInit {
  private readonly container = viewChild<ElementRef<HTMLElement>>('canvas');
  private readonly reviewForm = viewChild.required<ReviewDetailComponent>('reviewForm');

  enabledCanvas = signal<boolean>(true);
  preview = signal<PreviewModeT>('desktop');
  languageId = signal<number>(0);
  saveAction = signal<boolean>(false);
  reviewChanges = signal<boolean>(true);
  initialized = signal<boolean>(false);
  originReview = signal<ReviewEntityI | null>(null);

  private readonly _pageReviewService = inject(PageReviewService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _dialogService = inject(DialogService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _pageService = inject(PageService);
  private readonly _templateService = inject(TemplateService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _router = inject(Router);
  private readonly _destroyRef = inject(DestroyRef);

  readonly permission = PermissionCode;
  readonly reviewPage = this._pageReviewService.reviewPage;
  readonly parameters = this._parameterService.publicParameters;

  readonly urlStatics = computed(
    () => findParameter('APP_STATICS_URL', this.parameters())?.value ?? '',
  );
  readonly comments = computed(() => this.reviewForm().reviewModel().comments);
  readonly bodyStyles = computed(() => {
    const reviewPage = this.reviewPage();
    if (!reviewPage) {
      return {};
    }
    const page = reviewPage.data as PageI;
    const pageData = (
      this.reviewChanges() ? page.reviewPage?.data?.dataReview : page.data
    ) as PageDataMongoI;
    const backgroundImage = pageData?.body.config?.['backgroundImage'];
    if (!backgroundImage || backgroundImage === '' || backgroundImage === 'null') {
      return {};
    }
    return {
      'background-image': `url('${this.urlStatics()}/${filterPath(backgroundImage)}')`,
    };
  });
  readonly headerStyles = computed(() => {
    const reviewPage = this.reviewPage();
    if (!reviewPage) {
      return {};
    }
    const template = reviewPage.data as TemplateI;
    const pageData = (
      this.reviewChanges() ? template.reviewTemplate?.data?.dataReview : template.data
    ) as TemplateDataMongoI;
    const backgroundImage = pageData?.header.config?.['backgroundImage'];
    if (!backgroundImage || backgroundImage === '' || backgroundImage === 'null') {
      return {};
    }
    return {
      'background-image': `url('${this.urlStatics()}/${filterPath(backgroundImage)}')`,
    };
  });
  readonly footerStyles = computed(() => {
    const reviewPage = this.reviewPage();
    if (!reviewPage) {
      return {};
    }
    const template = reviewPage.data as TemplateI;
    const pageData = (
      this.reviewChanges() ? template.reviewTemplate?.data?.dataReview : template.data
    ) as TemplateDataMongoI;
    const backgroundImage = pageData?.footer.config?.['backgroundImage'];
    if (!backgroundImage || backgroundImage === '' || backgroundImage === 'null') {
      return {};
    }
    return {
      'background-image': `url('${this.urlStatics()}/${filterPath(backgroundImage)}')`,
    };
  });
  readonly pageElementsConfig = computed(() => {
    const reviewPage = this.reviewPage();
    if (!reviewPage) {
      return { css: '', config: {} };
    }
    const page = reviewPage.data as PageI;
    const pageData = (
      this.reviewChanges() ? page.reviewPage?.data?.dataReview : page.data
    ) as PageDataMongoI;
    return { css: pageData.body.css, config: pageData.body.config };
  });
  readonly headerElementsConfig = computed(() => {
    const reviewPage = this.reviewPage();
    if (!reviewPage) {
      return { css: '', config: {} };
    }
    const template = reviewPage.data as TemplateI;
    const pageData = (
      this.reviewChanges() ? template.reviewTemplate?.data?.dataReview : template.data
    ) as TemplateDataMongoI;
    return { css: pageData.header.css, config: pageData.header.config };
  });
  readonly footerElementsConfig = computed(() => {
    const reviewPage = this.reviewPage();
    if (!reviewPage) {
      return { css: '', config: {} };
    }
    const template = reviewPage.data as TemplateI;
    const pageData = (
      this.reviewChanges() ? template.reviewTemplate?.data?.dataReview : template.data
    ) as TemplateDataMongoI;
    return { css: pageData.footer.css, config: pageData.footer.config };
  });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const reviewPage = this.reviewPage();

      if (!reviewPage || this.initialized()) {
        return;
      }

      const statusReview = reviewPage.status;
      if (statusReview === 'approved' || statusReview === 'rejected') {
        this.goToBack();
      }

      this.initialized.set(true);
      if (this.originReview() === null) this.originReview.set(structuredClone(reviewPage));

      this.reviewChanges.set(true);
      if (reviewPage.type === 'page') {
        const page = reviewPage.data as PageI;
        this._pageService.page.set(page);
      } else {
        const template = reviewPage.data as TemplateI;
        this._templateService.template.set(template);
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
   * Go to review page list
   */
  goToBack() {
    this._pageReviewService.reviewPage.set(null);
    this._router.navigateByUrl('/admin/content/review-pages');
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
   * Cancel changes
   */
  cancel() {
    this.reviewForm().reviewModel.update(() => ({
      status: null,
      comment: '',
      comments: [],
    }));
  }

  /**
   * Review changes in the page
   */
  onReviewPage() {
    this.saveAction.set(true);
    const reviewPage = this.reviewPage();
    if (!reviewPage) return;
    const value = this.reviewForm().reviewModel();
    const entity = `${this.reviewPage()?.type === 'page' ? 'página' : 'plantilla'}`;
    this._pageReviewService
      .reviewPageContent(reviewPage.id, value)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this._toastrService.success(
            `La revisión de la ${entity} se realizó correctamente.`,
            `Revisión Existosa`,
          );
          this.goToBack();
        },
        error: (err) => {
          this._toastrService.error(
            err.error?.message || `No fue posible guardar cambios de la revisión de la ${entity}.`,
            'Error al revisar',
          );
          this.saveAction.set(false);
        },
      });
  }

  /**
   *  Confirm review page
   */
  confirmReviewPage() {
    const isInvalid = this.reviewForm().reviewForm().invalid();
    if (isInvalid) {
      this._toastrService.warning(
        'Completa el formulario de revisión antes de continuar.',
        'Revisión pendiente',
      );
      this.reviewForm().reviewForm().markAsTouched();
      return;
    }

    const entity = `${this.reviewPage()?.type === 'page' ? 'página' : 'plantilla'}`;
    const action = this.reviewForm().reviewModel().status === 'approved' ? 'Aprobar' : 'Rechazar';
    this._dialogService.setDialogData({
      type: 'warning',
      title: `Revisar ${entity}`,
      message: `¿Estas seguro/a que deseas <span class='font-extrabold'> ${action} </span> los cambios de la ${entity} ${this.reviewPage()?.data.name}?. Esta acción no se puede deshacer.`,
      confirmButton: `Si, ${action}`,
      cancelButton: 'Cancelar',
    });

    this._dialogService.toggleDialog();
    this._dialogService.actionClick$
      .pipe(take(1), takeUntilDestroyed(this._destroyRef))
      .subscribe((result) => {
        if (result) {
          this.onReviewPage();
        }
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
   * Set changes to in grid
   * @param mode
   */
  setReviewChanges(value: boolean) {
    this.reviewChanges.set(!value);
    const reviewPage = this.reviewPage();
    if (!reviewPage) return;
    if (reviewPage.type === 'page') {
      this._pageService.page.set(null);
      const page = reviewPage.data as PageI;
      page.reviewPage!.review! = !value;
      this._pageService.page.set(page);
    } else {
      this._templateService.template.set(null);
      const template = reviewPage.data as TemplateI;
      template.reviewTemplate!.review! = !value;
      this._templateService.template.set(template);
    }
  }

  /**
   * Set language
   * @param id
   */
  setLanguageId(id: number) {
    this.languageId.set(id);
  }

  /**
   * Add comment of review
   */
  addComment(newComment: ReviewCommentI): void {
    this.reviewForm().reviewModel.update((prev) => ({
      ...prev,
      comments: [newComment, ...prev.comments],
    }));
  }

  /**
   * Remove comment
   */
  removeComment(uuid: string): void {
    this.reviewForm().reviewModel.update((prev) => ({
      ...prev,
      comments: prev.comments.filter((comment) => comment.uuid !== uuid),
    }));
  }
}
