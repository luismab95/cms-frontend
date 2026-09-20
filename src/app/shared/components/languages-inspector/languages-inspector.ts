import {
  AfterViewInit,
  Component,
  effect,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
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
import { TabsComponent } from '../tabs/tabs';
import { ElementDataI } from 'app/shared/interfaces/element.interface';
import { LanguageI } from 'app/shared/interfaces/language.interfaces';
import { TabI } from 'app/shared/interfaces/drawer.interface';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { PageService } from 'app/core/services/pages.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { updateElement } from 'app/shared/utils/grid.utils';
import { ElementI } from 'app/shared/interfaces/grid.interface';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'languages-inspector-component',
  templateUrl: './languages-inspector.html',
  imports: [FormsModule, ReactiveFormsModule, TabsComponent, TitleCasePipe],
})
export class LangugesInspectorComponent implements OnInit, AfterViewInit, OnDestroy {
  data = input.required<ElementDataI[]>();
  text = input.required<{ [key: string]: string }>();
  tabs = input.required<TabI[]>();
  languages = input.required<LanguageI[]>();

  selectedLanguage = signal<number>(0);
  hasTextToEdit = signal<number>(0);

  languageForm!: UntypedFormGroup;
  getErrorMessage = CmsValidators.getErrorMessageFormControl;

  private _unsubscribeAll = new Subject<void>();

  private readonly _pageService = inject(PageService);

  readonly sectionsInCanvas = this._pageService.sections;

  readonly selectedItemsInGrid = toSignal(this._pageService.selectedItemsInGrid$, {
    initialValue: {
      section: null,
      row: null,
      column: null,
      element: null,
    },
  });

  private _formBuilder = inject(UntypedFormBuilder);

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
      const text = this.text();
      const data = this.data();

      if (!languages.length || !Object.keys(text).length) {
        return;
      }

      this.hasTextToEdit.set(Object.keys(text).length);

      this.loadLanguageForm(languages, text, data);
    });
  }

  /**
   * OnInit
   * @returns
   */
  ngOnInit(): void {}

  /**
   * AfterViewInit
   */
  ngAfterViewInit(): void {
    this.languageForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this._unsubscribeAll))
      .subscribe((value) => {
        this.updateItem(value);
      });
  }

  /**
   * OnDestroy
   */
  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  /**
   * Load form
   * @param languages
   */
  loadLanguageForm(languages: LanguageI[], text: { [key: string]: string }, data: ElementDataI[]) {
    const formArray = this.languagesFormArray;

    // Evitar duplicar idiomas
    formArray.clear();

    languages.forEach((language) => {
      const group = this._formBuilder.group({
        languageId: [language.id, Validators.required],
      });

      Object.keys(text).forEach((key) => {
        group.addControl(key, this._formBuilder.control(text[key], Validators.required));
      });

      formArray.push(group);
    });

    // data puede venir vacío
    if (data.length > 0) {
      formArray.patchValue(data);
    }
  }

  /**
   * get controls
   */
  get languagesFormArray(): FormArray {
    return this.languageForm.get('languages') as FormArray;
  }

  /**
   * Get controls
   * @param form
   * @returns
   */
  getControls(form: AbstractControl): string[] {
    if (!(form instanceof FormGroup)) {
      return [];
    }

    return Object.keys(form.controls);
  }

  /**
   * Selecciona un idioma por su INDEX.
   */
  selectLanguage(index: number): void {
    this.selectedLanguage.set(index);
  }

  /**
   * Update item
   * @param value
   */
  updateItem(value: { languages: ElementDataI[] }): void {
    const selectedElement = this.selectedItemsInGrid()?.element;

    if (!selectedElement) {
      return;
    }

    const updatedElement: ElementI = {
      ...selectedElement,
      dataText: [...value.languages],
    };

    const updatedSections = updateElement(
      this.sectionsInCanvas(),
      updatedElement.uuid,
      updatedElement,
    );

    this._pageService.sections = updatedSections;
  }
}
