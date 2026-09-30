import { Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { form, FormField } from '@angular/forms/signals';
import { CanvasT } from 'app/core/interfaces/page.interface';
import {
  ElementDataI,
  LanguageFormData,
  LanguagesFormModel,
} from 'app/shared/interfaces/element.interface';
import { LanguageI } from 'app/shared/interfaces/language.interfaces';
import { TabI } from 'app/shared/interfaces/drawer.interface';
import { ElementI, SectionI } from 'app/shared/interfaces/grid.interface';
import { updateElement } from 'app/shared/utils/grid.utils';
import { CanvasService } from 'app/core/services/canvas.service';
import { TemplateService } from 'app/core/services/templates.service';
import { PageService } from 'app/core/services/pages.service';
import { TabsComponent } from '../../tabs/tabs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'languages-inspector-component',
  templateUrl: './languages-inspector.html',
  imports: [FormField, TabsComponent, KeyValuePipe],
})
export class LangugesInspectorComponent {
  tabs = input.required<TabI[]>();
  languages = input.required<LanguageI[]>();
  gridType = input.required<CanvasT>();

  selectedLanguage = signal<number>(0);
  hasTextToEdit = signal<number>(0);

  private readonly initialized = signal<boolean>(false);
  readonly languageModel = signal<LanguagesFormModel>({
    languages: [],
  });
  readonly languageForm = form(this.languageModel);

  private readonly _pageService = inject(PageService);
  private readonly _templateService = inject(TemplateService);
  private readonly _canvasService = inject(CanvasService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly page = this._pageService.page;
  readonly template = this._templateService.template;
  readonly selectedItemsInGrid = this._canvasService.selectedItemsInGrid;

  readonly selectedElement = computed(() => this.selectedItemsInGrid()?.element);
  readonly data = computed(() => this.selectedElement()?.dataText ?? []);
  readonly text = computed(() => this.selectedElement()?.text ?? {});

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const tabs = this.tabs();
      if (tabs.length > 0) {
        this.selectedLanguage.set(tabs[0].id);
      }
    });

    effect(() => {
      const languages = this.languages();
      const data = this.data();
      const text = this.text();

      if (!text || !data) return;
      if (!languages.length || !Object.keys(text).length) return;

      this.hasTextToEdit.set(Object.keys(text).length);
      this.loadLanguageForm(languages, text, data);
      this.initialized.set(true);
    });

    toObservable(this.languageModel)
      .pipe(
        debounceTime(600),
        distinctUntilChanged(
          (previous, current) => JSON.stringify(previous) === JSON.stringify(current),
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((current) => {
        if (!this.initialized()) return;
        this.updateItem(current);
      });
  }

  /**
   * Loads the available languages and text values
   * into the Signal Form model.
   * @param languages
   * @param text
   * @param data
   */
  loadLanguageForm(
    languages: LanguageI[],
    text: { [key: string]: string },
    data: ElementDataI[],
  ): void {
    const languagesData: LanguageFormData[] = languages.map((language) => {
      const existingData = data?.find((item) => Number(item['languageId']) === Number(language.id));

      const languageData: LanguageFormData = {
        languageId: language.id?.toString()!,
      };

      Object.keys(text).forEach((key) => {
        languageData[key] = existingData?.[key] ?? text[key] ?? '';
      });

      return languageData;
    });

    this.languageModel.set({
      languages: languagesData,
    });
  }

  /**
   * Select language tab.
   * @param index
   */
  selectLanguage(index: number): void {
    this.selectedLanguage.set(index);
  }

  /**
   * Update selected canvas element.
   * @param value
   */
  private updateItem(value: LanguagesFormModel): void {
    const selectedItem = this.selectedItemsInGrid();

    const selectedElement = this.selectedElement();

    if (!selectedElement || !selectedItem) {
      return;
    }

    const updatedElement: ElementI = {
      ...selectedElement,

      dataText: [...value.languages] as ElementDataI[],
    };

    const sections = this.currentSections;

    const previous = structuredClone(sections);

    const updatedSections = updateElement(sections, updatedElement.uuid, updatedElement);

    const next = structuredClone(updatedSections);

    this.currentSections = next;

    this._canvasService.selectedItemsInGrid.set({
      ...selectedItem,
      element: updatedElement,
    });

    this._canvasService.updateChangesInCanvas(this.gridType(), previous, next);
  }

  /**
   * Current sections
   */
  private get currentSections(): SectionI[] {
    return this._canvasService.sectionsByType[this.gridType()].get();
  }

  /**
   * Update current sections
   * @param sections
   */
  private set currentSections(sections: SectionI[]) {
    this._canvasService.sectionsByType[this.gridType()].set(sections);
  }
}
