import { NgClass } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import {
  applyEach,
  disabled,
  FieldTree,
  form,
  FormField,
  maxLength,
  required,
} from '@angular/forms/signals';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ActionReviewI, CanvasT, ReviewModelI, TypeReviewItemT } from '@core/interfaces';
import { findElementByUuid, hasErrorFormField, PermissionCode, validAction } from '@shared/utils';
import { TooltipDirective } from '@shared/directives';
import { ElementI } from '@shared/interfaces';
import { CanvasService, ElementService } from '@core/services';

@Component({
  selector: 'review-detail-component',
  templateUrl: './detail.html',
  imports: [NgClass, NgSelectComponent, FormField, TooltipDirective],
})
export class ReviewDetailComponent {
  gridType = input.required<CanvasT>();

  reviewFormCollapsed = signal<boolean>(false);
  reviewModel = signal<ReviewModelI>({
    status: null,
    comment: '',
    comments: [],
  });

  reviewForm = form(this.reviewModel, (schemaPath) => {
    required(schemaPath.comment, {
      message: 'Observación es obligatoria.',
      when: ({ valueOf }) => {
        return valueOf(schemaPath.status) === 'rejected' || valueOf(schemaPath.comments).length > 0;
      },
    });
    maxLength(schemaPath.comment, 255, {
      message: 'Observación no puede superar los 255 caracteres.',
    });
    required(schemaPath.status, { message: 'Acción es obligatorio.' });
    disabled(schemaPath, {
      when: () => !this.validPermission(this.permission.toogleStatusReviewPage),
    });
    applyEach(schemaPath.comments, (path) => {
      required(path.comment, {
        message: 'Observación es obligatoria.',
      });
      maxLength(path.comment, 255, {
        message: 'Observación no puede superar los 255 caracteres.',
      });
    });
  });

  private readonly _elementService = inject(ElementService);
  private readonly _canvasService = inject(CanvasService);

  readonly elements = this._elementService.elements;
  readonly permission = PermissionCode;
  readonly hasError = hasErrorFormField;

  readonly sectionsInCanvas = computed(() => {
    return this._canvasService.sectionsByType[this.gridType()].get();
  });
  readonly actionsReview = computed(() => {
    return [
      { id: 'rejected', value: 'Rechazar', disabled: false },
      { id: 'approved', value: 'Aprobar', disabled: this.reviewModel().comments.length > 0 },
    ];
  });

  /**
   * Constructor
   */
  constructor() {}

  /**
   * Valid render permission
   * @param code
   * @returns
   */
  validPermission(code: string) {
    return validAction(code);
  }

  /**
   * Toggle review form
   */
  toggleReviewForm(): void {
    this.reviewFormCollapsed.update((collapsed) => !collapsed);
  }

  /**
   * Get Errors
   * @param field
   * @returns
   */
  firstErrorMessage(field: FieldTree<unknown> | undefined): string {
    if (typeof field !== 'function') return '';
    return field().errors()[0]?.message ?? '';
  }

  /**
   * Icon for type
   * @returns
   */
  itemIconClass(type: TypeReviewItemT, uuid: string): string {
    const icons: Record<string, string> = {
      header: 'fa-solid fa-table text-gray-600',
      body: 'fa-solid fa-table-cells text-gray-600',
      footer: 'fa-solid fa-table text-gray-600',
      section: 'fa-solid fa-object-group text-indigo-600',
      row: 'fa-solid fa-table-list text-amber-600',
      column: 'fa-solid fa-table-columns text-slate-600',
    };

    if (type === 'element') {
      const element = findElementByUuid(this.sectionsInCanvas(), uuid);
      return `${this.getElementIcon(element!)} text-emerald-600`;
    }
    return icons[type] ?? 'fa-solid fa-cube text-slate-600';
  }

  /**
   * Get element icon
   * @param element
   * @returns
   */
  getElementIcon(element: ElementI) {
    return this.elements().records.find((f) => f.name === element.name)?.icon ?? 'fa-solid fa-cube';
  }

  /**
   * when action change
   * @param data
   */
  onChangeStatus(data: ActionReviewI) {
    if (data.id === 'approved') this.reviewModel.update((prev) => ({ ...prev, comment: '' }));
  }
}
