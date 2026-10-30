import { Component, computed, inject, input, output } from '@angular/core';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { CanvasService, PageService, TemplateService } from '@core/services';
import { PluginPropertiesI } from '@shared/interfaces';
import { TooltipDirective } from '@shared/directives';
import { PageReviewStatusT, ReviewCommentI } from '@core/interfaces';

@Component({
  selector: 'element-wrapper-component',
  templateUrl: './element-wrapper.html',
  imports: [NgClass, NgTemplateOutlet, TooltipDirective],
})
export class ElementWrappeComponent {
  element = input.required<PluginPropertiesI>();
  preview = input.required<boolean>();
  isInReviewMode = input.required<boolean>();
  comments = input.required<ReviewCommentI[]>();
  selectElementEvent = output<string>();

  private readonly _canvasService = inject(CanvasService);
  private readonly _templateService = inject(TemplateService);
  private readonly _pageService = inject(PageService);

  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

  readonly rejectedChanges = computed(() => {
    const page = this._pageService.page;
    const template = this._templateService.template;
    if (!page() && !template()) return false;

    if (page()) {
      return page()?.reviewPage?.data?.statusReview === 'rejected';
    }

    if (template()) {
      return template()?.reviewTemplate?.data?.statusReview === 'rejected';
    }

    return false;
  });

  readonly reviewChanges = computed(() => {
    const page = this._pageService.page;
    const template = this._templateService.template;
    if (!page() && !template()) return false;
    const status: PageReviewStatusT[] = ['assigned', 'pending'];

    if (page()) {
      return status.includes(page()?.reviewPage?.data?.statusReview!);
    }

    if (template()) {
      return status.includes(template()?.reviewTemplate?.data?.statusReview!);
    }

    return false;
  });
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
   * Find if item in canvas has comment
   * @param uuid
   * @returns
   */
  findComment(uuid: string): string {
    const comments = this.comments();
    const comment = comments.find((c) => c.uuid === uuid);
    if (!comment) return '';
    return comment.comment;
  }

  /**
   * Emit event to select
   */
  selectElement() {
    this.selectElementEvent.emit(this.element().uuid);
  }
}
