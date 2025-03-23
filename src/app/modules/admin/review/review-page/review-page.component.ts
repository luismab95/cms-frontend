import { NgClass, NgStyle } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewEncapsulation,
    inject,
    signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ParameterI } from 'app/modules/admin/parameters/parameter.interface';
import { ParameterService } from 'app/modules/admin/parameters/parameter.service';
import { GridComponent } from 'app/shared/components/grid/grid.component';
import { LanguagesComponent } from 'app/shared/components/languages/languages.component';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';
import { SectionI } from 'app/shared/interfaces/grid.interface';
import { LanguageService } from 'app/shared/services/language.service';
import { ModalService } from 'app/shared/services/modal.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { ModalReviewComponent } from '../modal-review/modal-review.component';
import { ReviewPageService } from '../review.service';
import { PageReviewDataI, ReviewPageI } from '../review.types';
@Component({
    selector: 'pages-review-page',
    templateUrl: './review-page.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        NgClass,
        MatTooltipModule,
        GridComponent,
        MatMenuModule,
        NgStyle,
        ReactiveFormsModule,
        LanguagesComponent,
        PermissionComponent,
    ],
})
export class PagesReviewPageComponent implements OnInit {
    page: PageReviewDataI;
    preview: string = 'desktop';
    previewMode: boolean = true;
    refreshContent = signal<boolean>(false);
    reviewChanges = signal<boolean>(true);
    body = signal<SectionI[]>([]);
    saveAction = signal<boolean>(false);
    urlStatics: string;
    permission = PermissionCode;
    languageId: number;

    private readonly _dialog = inject(MatDialog);
    private _parameterService = inject(ParameterService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _modalSvc: ModalService,
        private _reviewPageService: ReviewPageService,
        private _toastrService: ToastrService,
        private _languageService: LanguageService,
        private _changeDetectorRef: ChangeDetectorRef
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
                this.languageId = languages.records[0].id;

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
        // Get page
        this._reviewPageService.page$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((page) => {
                // Update the page
                this.page = page;
                this.loadPageData();

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
     * Load template data from the server and update the component properties accordingly.
     */
    loadPageData() {
        if (this.page) {
            this.setGrid();
            this.loadStyles();

            // Mark for check
            this._changeDetectorRef.markForCheck();
        }
    }

    /**
     * Load styles
     */
    loadStyles() {
        // Load CSS
        const key = this.reviewChanges() ? 'dataReview' : 'data';
        const styleElementToRemove =
            document.getElementById('body-dynamicStyles');
        if (styleElementToRemove) {
            styleElementToRemove.remove();
        }
        const styleElement = document.createElement('style');
        styleElement.id = 'body-dynamicStyles';
        styleElement.textContent = `${this.page[key].body.css}`;
        document.head.appendChild(styleElement);
    }

    /**
     * Get config styles
     * @returns
     */
    getStyles() {
        let styles = {};
        const key = this.reviewChanges() ? 'dataReview' : 'data';
        if (this.page[key].body.config.backgroundImage !== '') {
            styles = {
                'background-image': `url('${this.urlStatics}/${this.page[key].body.config.backgroundImage}')`,
            };
        }
        return styles;
    }

    /**
     * Set preview mode
     * @param mode
     */
    setPreview(mode: string) {
        this.preview = mode;
        this.previewMode = mode !== 'none' ? true : false;
    }

    /**
     * Ir atras
     *
     */
    goToBack() {
        this._router.navigateByUrl('/admin/modules/review-pages');
    }

    /**
     * Valid render permission
     */
    validPermission(code: string) {
        return true;
        return validAction(code);
    }

    /**
     * Set data to grid
     */
    setGrid() {
        if (this.reviewChanges()) {
            this.body.set(this.page.dataReview.body.data);
        } else {
            this.body.set(this.page.data.body.data);
        }
    }

    /**
     * Load data grid
     */
    loadDataGrid() {
        this.refreshContent.set(true);
        this.reviewChanges.update((value) => !value);

        this.loadPageData();

        setTimeout(() => {
            this.refreshContent.set(false);
        }, 100);
    }

    /**
     * Set language
     * @param id
     */
    setLanguageId(id: number) {
        this.languageId = id;
        this.refreshContent.set(true);

        // Mark for check
        this._changeDetectorRef.markForCheck();

        setTimeout(() => {
            this.refreshContent.set(false);
        }, 100);
    }

    /**
     * Open review modal
     */
    openReviewModal() {
        const dialogRef = this._modalSvc.openModal(ModalReviewComponent);

        dialogRef.afterClosed().subscribe((result: ReviewPageI) => {
            if (result) {
                this.reviewPage(result);
            }
        });
    }

    /**
     * Review page
     */
    reviewPage(data: ReviewPageI) {
        // Disable the save action
        this.saveAction.set(true);

        this._reviewPageService
            .reviewPage(this.page.reviewId, data)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the save action
                    this.saveAction.set(false);
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );

                    this.goToBack();
                },
                error: (response) => {
                    // Re-enable the save action
                    this.saveAction.set(false);

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }
}
