import { NgClass, NgStyle } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { CanvasT, ReviewCommentI, TypeReviewItemT } from '@core/interfaces';
import {
  PageService,
  CanvasService,
  DynamicStyleService,
  ParameterService,
  TemplateService,
} from '@core/services';
import { TooltipDirective } from '@shared/directives';
import {
  PageElementsConfigI,
  SectionI,
  RowI,
  ColumnI,
  ElementI,
  SelectedItemsInGridI,
} from '@shared/interfaces';
import { findParameter, filterPath } from '@shared/utils';
import { ElementsComponent } from '../element/elements';

@Component({
  selector: 'grid-review-component',
  templateUrl: './grid-review.html',
  imports: [NgClass, NgStyle, ElementsComponent, TooltipDirective],
})
export class GridReviewComponent implements OnDestroy {
  gridType = input.required<CanvasT>();
  gridStyles = input<any>({});
  pageElementsConfig = input.required<PageElementsConfigI>();
  languageId = input<number>();
  isInReviewMode = input<boolean>();
  previewType = input<string>('none');
  comments = input.required<ReviewCommentI[]>();
  addCommentEvent = output<ReviewCommentI>();
  removeCommentEvent = output<string>();

  preview = signal<boolean>(false);

  private readonly _pageService = inject(PageService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _dynamicStyleService = inject(DynamicStyleService);
  private readonly _parameterService = inject(ParameterService);
  private readonly _templateService = inject(TemplateService);

  readonly page = this._pageService.page;
  readonly template = this._templateService.template;
  readonly parameters = this._parameterService.publicParameters;

  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

  readonly urlStatics = computed(
    () => findParameter('APP_STATICS_URL', this.parameters())?.value ?? '',
  );
  readonly sectionsInCanvas = computed(() => {
    return this._canvasService.sectionsByType[this.gridType()].get();
  });
  readonly gridConfigStyles = (config: { [key: string]: any }) => {
    const backgroundImage = config['backgroundImage'];
    if (!backgroundImage || backgroundImage === '' || backgroundImage === 'null') return {};
    return {
      'background-image': `url('${this.urlStatics()}/${filterPath(backgroundImage)}')`,
    };
  };
  readonly typeReviewContent = computed(() => {
    return (this.gridType() === 'page' ? 'body' : this.gridType()) as TypeReviewItemT;
  });

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const page = this.page();
      if (!page || !page.data || this.gridType() !== 'page') return;
      const css = this.isInReviewMode()
        ? page.reviewPage?.data?.dataReview!.body.css
        : page.data.body.css;
      this.loadStylesPages('body-dynamicStyles', page.data.body.css);
    });

    effect(() => {
      const template = this.template();
      if (!template || !template.data || this.gridType() === 'page') return;
      if (this.gridType() === 'header')
        this.loadStylesPages('header-dynamicStyles', template.data.header.css);
      if (this.gridType() === 'footer')
        this.loadStylesPages('footer-dynamicStyles', template.data.footer.css);
    });
  }

  /**
   * OnDestroy
   */
  ngOnDestroy(): void {
    this._dynamicStyleService.remove(
      `${this.gridType() === 'page' ? 'body' : this.gridType()}-dynamicStyles`,
    );
  }

  /**
   * Load styles
   * @param styleId
   * @param cssContainer
   */
  loadStylesPages(styleId: string, cssContainer: string): void {
    this._dynamicStyleService.remove(styleId);
    const css: string[] = [];
    css.push(cssContainer);
    for (const section of this.sectionsInCanvas()) {
      css.push(section.css);
      for (const row of section.rows) {
        css.push(row.css);
        for (const column of row.columns) {
          css.push(column.css);
          if (column.element) {
            css.push(column.element.css);
          }
        }
      }
    }
    const uniqueCss = css.join('\n');
    this._dynamicStyleService.set(styleId, uniqueCss);
  }

  /**
   * Select page config and reset the nested selections.
   */
  selectPageConfig() {
    this.updateSelectionItem(
      {
        page: this.pageElementsConfig(),
        section: null,
        row: null,
        column: null,
        element: null,
        canvas: this.gridType(),
      },
      { uuid: this.gridType(), type: this.typeReviewContent(), comment: '' },
    );
  }

  /**
   * Select a section and reset the nested selections.
   * @param section
   */
  selectSection(section: SectionI): void {
    this.updateSelectionItem(
      {
        page: null,
        section,
        row: null,
        column: null,
        element: null,
        canvas: this.gridType(),
      },
      { uuid: section.uuid, type: 'section', comment: '' },
    );
  }

  /**
   * Select a row and reset the lower-level selections.
   * @param row
   */
  selectRow(row: RowI): void {
    this.updateSelectionItem(
      {
        page: null,
        section: null,
        row,
        column: null,
        element: null,
        canvas: this.gridType(),
      },
      { uuid: row.uuid, type: 'row', comment: '' },
    );
  }

  /**
   * Select a column and clear the element selection.
   * @param column
   */
  selectColumn(column: ColumnI): void {
    this.updateSelectionItem(
      {
        page: null,
        section: null,
        row: null,
        column,
        element: null,
        canvas: this.gridType(),
      },
      { uuid: column.uuid, type: 'column', comment: '' },
    );
  }

  /**
   * Select an element.
   * @param element
   */
  selectElement(element: ElementI): void {
    this.updateSelectionItem(
      {
        page: null,
        section: null,
        row: null,
        column: null,
        element,
        canvas: this.gridType(),
      },
      { uuid: element.uuid, type: 'element', comment: '' },
    );
  }

  /**
   * Selected items
   * @param selectedItemsInGrid
   */
  updateSelectionItem(selectedItemsInGrid: SelectedItemsInGridI, comment: ReviewCommentI) {
    this._canvasService.selectedItemsInGrid.set(null);
    setTimeout(() => {
      this._canvasService.selectedItemsInGrid.set(selectedItemsInGrid);
      this.addCommentEvent.emit(comment);
    });
  }

  /**
   * Find if item in canvas has comment
   * @param uuid
   * @returns
   */
  hasComment(uuid: string): boolean {
    const comments = this.comments();
    const hasComment = comments.find((c) => c.uuid === uuid);
    if (!hasComment) return false;
    return true;
  }

  /**
   * Remove comment
   * @param uuid
   */
  removeCommnet(uuid: string) {
    this.removeCommentEvent.emit(uuid);
  }
}
