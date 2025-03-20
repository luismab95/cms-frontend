import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    inject,
    OnDestroy,
    OnInit,
    Output,
    ViewEncapsulation,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { LanguageService } from 'app/modules/admin/sitie/languages/language.service';
import { LanguageI } from 'app/modules/admin/sitie/languages/language.types';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'languages',
    templateUrl: './languages.component.html',
    standalone: true,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatButtonModule,
        MatMenuModule,
        NgTemplateOutlet,
        ReactiveFormsModule,
    ],
})
export class LanguagesComponent implements OnInit, OnDestroy {
    @Output() languageEvent: EventEmitter<number> = new EventEmitter<number>();

    languages: LanguageI[] = [];
    languageControl: FormControl = new FormControl();
    urlStatics: string;

    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _languageService: LanguageService
    ) {
        // Get parameters
        this._parameterService.parameter$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((parameters: ParameterI[]) => {
                this.urlStatics = findParameter(
                    'APP_STATICS_URL',
                    parameters
                ).value;
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get languages
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
        this.languageControl.setValue(this.languages[0].id);

        this.languageControl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((value) => {
                this.languageEvent.emit(value);
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
     * Set the active lang
     *
     * @param id
     */
    setActiveLang(id: number): void {
        // Set the active lang
        this.languageControl.setValue(id);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get  language by id
     * @returns
     */
    getLanguage() {
        return this.languages.find(
            (language) => language.id === this.languageControl.value
        );
    }
}
