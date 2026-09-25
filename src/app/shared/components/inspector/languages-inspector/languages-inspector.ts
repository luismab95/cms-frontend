import { Component, DestroyRef, effect, inject, input, OnInit, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CanvasT } from 'app/core/interfaces/page.interface';
import { ElementDataI } from 'app/shared/interfaces/element.interface';
import { LanguageI } from 'app/shared/interfaces/language.interfaces';
import { TabI } from 'app/shared/interfaces/drawer.interface';
import { updateElement } from 'app/shared/utils/grid.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { PageService } from 'app/core/services/pages.service';
import { ElementI, SectionI } from 'app/shared/interfaces/grid.interface';
import { TabsComponent } from '../../tabs/tabs';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'languages-inspector-component',
  templateUrl: './languages-inspector.html',
  imports: [FormsModule, ReactiveFormsModule, TabsComponent, TitleCasePipe],
})
export class LangugesInspectorComponent implements OnInit {
  data = input.required<ElementDataI[]>();
  text = input.required<{ [key: string]: string }>();
  tabs = input.required<TabI[]>();
  languages = input.required<LanguageI[]>();
  gridType = input.required<CanvasT>();

  selectedLanguage = signal<number>(0);
  hasTextToEdit = signal<number>(0);

  languageForm!: UntypedFormGroup;
  getErrorMessage = CmsValidators.getErrorMessageFormControl;

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _pageService = inject(PageService);
  private readonly _historyService = inject(HistoryService);
  private readonly _formBuilder = inject(UntypedFormBuilder);

  readonly pageSections = this._pageService.sections;
  readonly headerSections = this._pageService.sectionsHeader;
  readonly footerSections = this._pageService.sectionsFooter;

  readonly selectedItemsInGrid = toSignal(this._pageService.selectedItemsInGrid$, {
    initialValue: null,
  });

  readonly sectionsByType = {
    header: {
      get: () => this.headerSections(),
      set: (sections: SectionI[]) => {
        this._pageService.sectionsHeader = sections;
      },
    },
    body: {
      get: () => this.pageSections(),
      set: (sections: SectionI[]) => {
        this._pageService.sections = sections;
      },
    },
    footer: {
      get: () => this.footerSections(),
      set: (sections: SectionI[]) => {
        this._pageService.sectionsFooter = sections;
      },
    },
  } satisfies Record<
    CanvasT,
    {
      get: () => SectionI[];
      set: (sections: SectionI[]) => void;
    }
  >;

  /**
   * Constructor
   */
  constructor() {
    this.languageForm = this._formBuilder.group({
      languages: this._formBuilder.array([]),
    });

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

      if (!languages.length || !Object.keys(text).length) {
        return;
      }

      this.hasTextToEdit.set(Object.keys(text).length);
      this.loadLanguageForm(languages, text, data);
    });
  }

  /**
   * OnInit
   */
  ngOnInit(): void {
    this.languageForm.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(
          (previous, current) => JSON.stringify(previous) === JSON.stringify(current),
        ),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((current) => {
        this.updateItem(current);
      });
  }

  /**
   * Loads the available languages and text values into the form.
   * @param languages Available languages.
   * @param text Text fields to create for each language.
   * @param data Existing language data to apply to the form.
   */
  loadLanguageForm(
    languages: LanguageI[],
    text: { [key: string]: string },
    data: ElementDataI[],
  ): void {
    const formData = JSON.stringify({
      languages,
      text,
      data,
    });

    const formArray = this.languagesFormArray;

    formArray.clear({
      emitEvent: false,
    });

    languages.forEach((language) => {
      const group = this._formBuilder.group({
        languageId: [language.id, Validators.required],
      });

      Object.keys(text).forEach((key) => {
        group.addControl(key, this._formBuilder.control(text[key], Validators.required));
      });

      formArray.push(group, {
        emitEvent: false,
      });
    });

    if (data?.length > 0) {
      formArray.patchValue(data, {
        emitEvent: false,
      });
    }
  }

  /**
   * Returns the form array containing the language controls.
   */
  get languagesFormArray(): FormArray {
    return this.languageForm.get('languages') as FormArray;
  }

  /**
   * Returns the control names from a form group.
   * @param form Form control to inspect.
   */
  getControls(form: AbstractControl): string[] {
    if (!(form instanceof FormGroup)) {
      return [];
    }

    return Object.keys(form.controls);
  }

  /**
   * Selects a language tab.
   * @param index Index of the selected language.
   */
  selectLanguage(index: number): void {
    this.selectedLanguage.set(index);
  }

  /**
   * Update item
   * @param value
   * @returns
   */
  updateItem(value: { languages: ElementDataI[] }): void {
    const selectedItem = this.selectedItemsInGrid();
    const selectedElement = selectedItem?.element;

    if (!selectedElement) {
      return;
    }

    const updatedElement: ElementI = {
      ...selectedElement,
      dataText: [...value.languages],
    };

    const sections = this.currentSections;
    const previous = structuredClone(sections);
    const updatedSections = updateElement(sections, updatedElement.uuid, updatedElement);
    const next = structuredClone(updatedSections);
    this.currentSections = next;
    this._historyService.commit(this.gridType(), previous, structuredClone(this.currentSections));
  }

  /**
   * currentSections
   */
  private get currentSections(): SectionI[] {
    return this.sectionsByType[this.gridType()].get();
  }

  /**
   * currentSections
   */
  private set currentSections(sections: SectionI[]) {
    this.sectionsByType[this.gridType()].set(sections);
  }
}
