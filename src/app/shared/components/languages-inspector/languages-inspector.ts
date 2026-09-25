import { Component, effect, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
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
import { toSignal } from '@angular/core/rxjs-interop';
import { TabsComponent } from '../tabs/tabs';
import { ElementDataI } from 'app/shared/interfaces/element.interface';
import { LanguageI } from 'app/shared/interfaces/language.interfaces';
import { TabI } from 'app/shared/interfaces/drawer.interface';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { HistoryService } from 'app/core/services/history-canvas.service';
import { PageService } from 'app/core/services/pages.service';
import { updateElement } from 'app/shared/utils/grid.utils';
import { ElementI, SectionI } from 'app/shared/interfaces/grid.interface';
import { CanvasT } from 'app/core/interfaces/page.interface';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'languages-inspector-component',
  templateUrl: './languages-inspector.html',
  imports: [FormsModule, ReactiveFormsModule, TabsComponent, TitleCasePipe],
})
export class LangugesInspectorComponent implements OnInit, OnDestroy {
  data = input.required<ElementDataI[]>();
  text = input.required<{ [key: string]: string }>();
  tabs = input.required<TabI[]>();
  languages = input.required<LanguageI[]>();

  selectedLanguage = signal<number>(0);
  hasTextToEdit = signal<number>(0);

  languageForm!: UntypedFormGroup;
  getErrorMessage = CmsValidators.getErrorMessageFormControl;

  private formInitialized = false;
  private lastFormData = '';

  private readonly _unsubscribeAll = new Subject<void>();

  private readonly _pageService = inject(PageService);
  private readonly _historyService = inject(HistoryService);
  private readonly _formBuilder = inject(UntypedFormBuilder);

  readonly pageSections = this._pageService.sections;
  readonly headerSections = this._pageService.sectionsHeader;
  readonly footerSections = this._pageService.sectionsFooter;

  readonly selectedItemsInGrid = toSignal(this._pageService.selectedItemsInGrid$, {
    initialValue: {
      section: null,
      row: null,
      column: null,
      element: null,
      canvas: 'body' as CanvasT,
    },
  });

  sectionsByType = {
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

  // --------------------------------------------------------------------------
  // Constructor
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // OnInit
  // --------------------------------------------------------------------------
  ngOnInit(): void {
    this.languageForm.valueChanges
      .pipe(
        debounceTime(600),
        distinctUntilChanged(
          (previous, current) => JSON.stringify(previous) === JSON.stringify(current),
        ),
        takeUntil(this._unsubscribeAll),
      )
      .subscribe((current) => {
        if (!this.formInitialized) {
          return;
        }
        this.updateItem(current);
      });
  }

  // --------------------------------------------------------------------------
  // OnDestroy
  // --------------------------------------------------------------------------
  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  // --------------------------------------------------------------------------
  // Load language form
  // --------------------------------------------------------------------------
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

    if (this.lastFormData === formData) {
      return;
    }

    this.lastFormData = formData;

    this.formInitialized = false;

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

    this.formInitialized = true;
  }

  // --------------------------------------------------------------------------
  // FormArray
  // --------------------------------------------------------------------------
  get languagesFormArray(): FormArray {
    return this.languageForm.get('languages') as FormArray;
  }

  // --------------------------------------------------------------------------
  // Get controls
  // --------------------------------------------------------------------------
  getControls(form: AbstractControl): string[] {
    if (!(form instanceof FormGroup)) {
      return [];
    }

    return Object.keys(form.controls);
  }

  // --------------------------------------------------------------------------
  // Select language
  // --------------------------------------------------------------------------
  selectLanguage(index: number): void {
    this.selectedLanguage.set(index);
  }

  // --------------------------------------------------------------------------
  // Update item
  // --------------------------------------------------------------------------
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

    const canvas = selectedItem.canvas;
    const config = this.sectionsByType[canvas];
    const sections = config.get();
    const previous = structuredClone(sections);
    const updatedSections = updateElement(sections, updatedElement.uuid, updatedElement);
    const next = structuredClone(updatedSections);
    config.set(next);
    this._historyService.commit(canvas, previous, next);
  }
}
