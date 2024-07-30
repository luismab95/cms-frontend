import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import {
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router, RouterLink } from '@angular/router';
import { SitieService } from 'app/modules/admin/sitie/sitie.service';
import { SitieI } from 'app/modules/admin/sitie/sitie.types';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { PageService } from '../../pages.service';
import { PageDataMongoI, PageI } from '../../pages.types';

@Component({
    selector: 'pages-information',
    templateUrl: './information.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatButtonModule,
        MatSlideToggleModule,
        RouterLink,
        MatProgressSpinnerModule,
    ],
})
export class PagesInformationComponent implements OnInit {
    page: PageI;
    sitie: SitieI;
    micrositie: any;
    pageForm: UntypedFormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _pageService: PageService,
        private _sitieService: SitieService,
        private _router: Router,
        private _toastrService: ToastrService,
        private _changeDetectorRef: ChangeDetectorRef
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.pageForm = this._formBuilder.group({
            name: ['', Validators.required],
            path: ['', Validators.required],
            status: [],
            isHomePage: [],
        });

        this._pageService.page$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((page) => {
                // Update the template
                this.page = page;

                if (this.page) {
                    this.pageForm.patchValue({ ...this.page });
                }
                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        this._sitieService.sitie$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((sitie) => {
                // Update the template
                this.sitie = sitie;

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
     * Add page
     */
    new() {
        if (this.page) {
            this.update();
            return;
        }

        // Return if the form is invalid
        if (this.pageForm.invalid) {
            return;
        }

        // Disable the form
        this.pageForm.disable();

        // ADD data
        this.pageForm.value.data = {
            body: {
                css: '.body{}',
                data: [],
                config: { backgroundImage: '' },
            },
        } as PageDataMongoI;

        //Delete status isHomePage
        delete this.pageForm.value.status;
        delete this.pageForm.value.isHomePage;

        this._pageService
            .create(this.pageForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.pageForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );

                    // Mark for check
                    this._changeDetectorRef.markForCheck();
                },
                error: (response) => {
                    // Re-enable the form
                    this.pageForm.enable();

                    // Set the alert
                    this._toastrService.error(response.error.message, 'Aviso');
                },
            });
    }

    /**
     * Update page
     */
    update() {
        // Return if the form is invalid
        if (this.pageForm.invalid) {
            return;
        }

        // Disable the form
        this.pageForm.disable();

        this._pageService
            .update(this.page.id, this.pageForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    // Re-enable the form
                    this.pageForm.enable();
                    // Set the alert
                    this._toastrService.success(
                        'Proceso realizado con éxito.',
                        'Aviso'
                    );
                },
                error: (response) => {
                    // Re-enable the form
                    this.pageForm.enable();

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
                state: { micrositie: this.micrositie },
            });
        } else {
            this._router.navigateByUrl('/admin/modules/pages');
        }
    }

    /**
     * Redirect to page
     */
    redirectPage() {
        window.open(`http://${this.sitie.domain}/${this.page.path}`, '_blank');
    }
}
