import { TextFieldModule } from '@angular/cdk/text-field';
import { TitleCasePipe } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import {
    FormArray,
    FormControl,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { LanguageService } from 'app/modules/admin/sitie/languages/language.service';
import { LanguageI } from 'app/modules/admin/sitie/languages/language.types';
import { ElementDataI } from 'app/shared/interfaces/element.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'languages-text',
    templateUrl: './languages-text.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        TextFieldModule,
        MatTabsModule,
        MatProgressSpinnerModule,
        TitleCasePipe,
    ],
})
export class LangugesTextComponent implements OnInit {
    @Input() text: { [key: string]: string } = {};
    @Input() data: ElementDataI[] = [];
    @Output() dataEvent: EventEmitter<ElementDataI[]> = new EventEmitter<
        ElementDataI[]
    >();
    languages: LanguageI[] = [];
    languageForm: UntypedFormGroup;
    countText: number = 0;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _languageService: LanguageService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        // Create the form
        this.languageForm = this._formBuilder.group({
            languages: this._formBuilder.array([]),
        });

        this._languageService.languages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((languages) => {
                // Update the template
                this.languages = languages.records;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        Object.keys(this.text).forEach((key) => {
            this.countText++;
        });

        if (this.countText > 0) {
            this.languages.forEach((language) => {
                this.addLanguage(language);
                if (this.data.length > 0) {
                    this.patchLanguagesWithData(this.data);
                }
            });

            this.languageForm.valueChanges
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe((value) => {
                    this.dataEvent.emit(value.languages);
                });
        }
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Add Language to the form array
     */
    addLanguage(language: LanguageI): void {
        const newLanguageGroup = this._formBuilder.group({
            languageId: [language.id, Validators.required],
        });

        Object.keys(this.text).forEach((key) => {
            newLanguageGroup.addControl(
                key,
                this._formBuilder.control(this.text[key], Validators.required)
            );
        });

        this.languagesFormArray.push(newLanguageGroup);
    }

    /**
     * Getter for the languages form array
     */
    get languagesFormArray(): FormArray {
        return this.languageForm.get('languages') as FormArray;
    }

    /**
     * Remove Languagefrom the form array
     * @param index
     */
    removeLanguage(index: number): void {
        this.languagesFormArray.removeAt(index);
    }

    /**
     * Set data to language form array
     * @param data
     */
    patchLanguagesWithData(data: ElementDataI[]): void {
        this.languageForm.patchValue({ languages: data });
    }

    /**
     * Get name language by id
     * @param id
     * @returns
     */
    getLanguageName(id: number) {
        return this.languages.find(
            (language) => Number(language.id) === Number(id)
        )?.name;
    }

    /**
     * Get controls for form array
     * @param controls
     * @returns
     */
    getControls(controls: { [key: string]: FormControl }) {
        const iteratorArray: string[] = [];
        Object.keys(controls).forEach((key) => {
            iteratorArray.push(key);
        });
        return iteratorArray;
    }
}
