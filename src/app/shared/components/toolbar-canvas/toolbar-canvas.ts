import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgClass, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
  NgSelectComponent,
} from '@ng-select/ng-select';
import { PreviewModeT } from '@core/interfaces';
import { TooltipDirective } from '@shared/directives';
import { LanguageService } from '@shared/services';

@Component({
  selector: 'toolbar-canvas-component',
  templateUrl: './toolbar-canvas.html',
  imports: [
    NgClass,
    TooltipDirective,
    FormsModule,
    UpperCasePipe,
    NgLabelTemplateDirective,
    NgOptionTemplateDirective,
    NgSelectComponent,
  ],
})
export class ToolbarCanvasComponent {
  private readonly languageSelect = viewChild.required<NgSelectComponent>('languageSelect');

  isInReviewMode = input.required<boolean>();
  urlStatics = input.required<string>();
  name = input.required<string>();
  saveAction = input.required<boolean>();
  previewMode = input.required<boolean>();
  autosave = input.required<boolean>();
  preview = input.required<PreviewModeT>();
  editContent = input.required<boolean>();
  editDesign = input.required<boolean>();
  canUndo = input.required<boolean>();
  canRedo = input.required<boolean>();
  goBackEvent = output<void>();
  togglePreviewModeEvent = output<void>();
  setPreviewModeEvent = output<PreviewModeT>();
  redoEvent = output<void>();
  undoEvent = output<void>();
  setLanguageIdEvent = output<number>();
  updateDraftEvent = output<void>();
  cancelEvent = output<void>();
  confirmUpdatePageEvent = output<void>();

  languageId = signal<number>(0);

  private readonly _languageService = inject(LanguageService);

  readonly languages = this._languageService.languages;

  readonly activeLanguages = computed(() => this.languages().records.filter((lang) => lang.status));

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const languages = this.activeLanguages();
      if (this.languageId() === 0 && languages.length > 0) {
        this.setLanguageId(languages[0].id!);
      }
    });
  }

  /**
   * Go to back event
   */
  goToBack() {
    this.goBackEvent.emit();
  }

  /**
   * Change preview mode
   */
  togglePreviewMode() {
    this.togglePreviewModeEvent.emit();
  }

  /**
   * Set preview mode breakpoint
   * @param mode
   */
  setPreviewMode(mode: PreviewModeT) {
    this.setPreviewModeEvent.emit(mode);
  }

  /**
   * Undo Changes
   */
  undo() {
    this.undoEvent.emit();
  }

  /**
   * Redo Changes
   */
  redo() {
    this.redoEvent.emit();
  }

  /**
   * Open language select
   * @param event
   */
  openLanguageSelect(event: MouseEvent): void {
    event.stopPropagation();
    this.languageSelect().open();
  }

  /**
   * Set language
   * @param id
   */
  setLanguageId(id: number) {
    this.languageId.set(id);
    this.setLanguageIdEvent.emit(id);
  }

  /**
   * Save draft event
   */
  updateDraft() {
    this.updateDraftEvent.emit();
  }

  /**
   * Cancel changes event
   */
  cancel() {
    this.cancelEvent.emit();
  }

  /**
   * Confirm save changes event
   */
  confirmUpdatePage() {
    this.confirmUpdatePageEvent.emit();
  }
}
