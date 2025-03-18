import { TextFieldModule } from '@angular/cdk/text-field';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import {
    FormArray,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { MicrosityService } from 'app/modules/admin/microsities/micrositie.service';
import { MicrositieI } from 'app/modules/admin/microsities/micrositie.types';
import { LanguageService } from 'app/modules/admin/sitie/languages/language.service';
import { LanguageI } from 'app/modules/admin/sitie/languages/language.types';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { PageService } from '../../pages.service';
import { PageDetailReferenceI, PageI } from '../../pages.types';

@Component({
    selector: 'pages-languages',
    templateUrl: './languages.component.html',
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
        MatButtonModule,
        MatTabsModule,
        MatProgressSpinnerModule,
    ],
})
export class PagesLangugesComponent implements OnInit {
    page: PageI;
    micrositie: MicrositieI;
    languages: LanguageI[] = [];
    languageForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private _toastrService: ToastrService,
        private _pageService: PageService,
        private _microsityService: MicrosityService,
        private _languageService: LanguageService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        this._microsityService.micrositie$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((micrositie) => {
                // Update the templates
                this.micrositie = micrositie;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Create the form
        this.languageForm = this._formBuilder.group({
            languages: this._formBuilder.array([]),
        });

        this._languageService.languages$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((languages) => {
                // Update the template
                this.languages = languages.records;
                this.languages.forEach((language) => {
                    this.addLanguage();
                });

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
        this._pageService.page$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((page) => {
                // Update the template
                this.page = page;

                if (this.page) {
                    // Load data for the form
                    this.patchLanguagesWithData(this.page.details);
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });
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
    addLanguage(): void {
        const newLanguageGroup = this._formBuilder.group({
            alias: ['', Validators.required],
            description: ['', [Validators.required, Validators.maxLength(255)]],
            keywords: ['', Validators.required],
            languageId: ['', Validators.required],
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
    patchLanguagesWithData(data: PageDetailReferenceI[]): void {
        data.forEach((language, index) => {
            const languageGroup = this._formBuilder.group({
                alias: [language.alias.text],
                description: [language.description.text],
                keywords: [language.keywords.text],
                languageId: [language.languageId],
            });
            this.languagesFormArray.at(index).patchValue(languageGroup.value);
        });
    }

    /**
     * Update page
     */
    update() {
        // Return if the form is invalid
        if (this.languageForm.invalid) {
            return;
        }

        // Disable the form
        this.languageForm.disable();

        const updatePage: PageI = {
            name: this.page.name,
            detail: [],
        };

        this.languageForm.value.languages.forEach((language) => {
            updatePage.detail.push({
                lang: language.languageId,
                references: [
                    { ref: this.page.aliasRef, value: language.alias },
                    {
                        ref: this.page.descriptionRef,
                        value: language.description,
                    },
                    {
                        ref: this.page.seoKeywordsRef,
                        value: language.keywords,
                    },
                ],
            });
        });

        this._pageService
            .update(this.page.id, updatePage)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.languageForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );
                },
                error: (response) => {
                    // Re-enable the form
                    this.languageForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Ir atras
     *
     */
    goToBack() {
        if (this.micrositie) {
            this._router.navigateByUrl('/admin/modules/microsities/detail', {
                state: { id: this.micrositie.id },
            });
        } else {
            this._router.navigateByUrl('/admin/modules/pages');
        }
    }

    /**
     * Get name language by id
     * @param id
     * @returns
     */
    getLanguageName(id: number) {
        return this.languages.find((language) => language.id === id)?.name;
    }
}
