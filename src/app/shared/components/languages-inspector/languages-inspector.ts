import { Component, effect, inject, input, OnDestroy, OnInit, output, signal } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs';

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
  dataEvent = output<ElementDataI[]>();

  selectedLanguage = signal<number>(0);
  hasTextToEdit = signal<number>(0);

  languageForm!: UntypedFormGroup;
  getErrorMessage = CmsValidators.getErrorMessageFormControl;

  private _unsubscribeAll = new Subject<void>();
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
    });
  }

  /**
   * OnInit
   * @returns
   */
  ngOnInit(): void {
    this.languageForm.valueChanges.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => {
      this.dataEvent.emit(value.languages);
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
   * get controls
   */
  get languagesFormArray(): FormArray {
    return this.languageForm.get('languages') as FormArray;
  }

  /**
   * add language
   * @param language
   */
  addLanguage(language: LanguageI): void {
    const newLanguageGroup = this._formBuilder.group({
      languageId: [language.id?.toString(), Validators.required],
    });

    Object.keys(this.text()).forEach((key) => {
      newLanguageGroup.addControl(
        key,
        this._formBuilder.control(this.text()[key], Validators.required),
      );
    });

    this.languagesFormArray.push(newLanguageGroup);
  }

  /**
   * load data
   * @param data
   */
  patchLanguagesWithData(data: ElementDataI[]): void {
    this.languagesFormArray.patchValue(data);
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
}
