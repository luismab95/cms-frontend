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
import { Router } from '@angular/router';
import { MicrosityService } from 'app/modules/admin/microsities/micrositie.service';
import { MicrositieI } from 'app/modules/admin/microsities/micrositie.types';
import { SitieService } from 'app/modules/admin/sitie/sitie.service';
import { SitieI } from 'app/modules/admin/sitie/sitie.types';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { PageService } from '../../pages.service';
import { PageDataMongoI, PageI } from '../../pages.types';
import { NgTemplateOutlet } from '@angular/common';
import { PermissionComponent } from 'app/shared/components/permission/permission.component';

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
        MatProgressSpinnerModule,
        NgTemplateOutlet,
        PermissionComponent
    ],
})
export class PagesInformationComponent implements OnInit {
    page: PageI;
    sitie: SitieI;
    micrositie: MicrositieI;
    pageForm: UntypedFormGroup;
    permission = PermissionCode;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _pageService: PageService,
        private _sitieService: SitieService,
        private _microsityService: MicrosityService,
        private _router: Router,
        private _toastrService: ToastrService,
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
    }

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
    create() {
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

        if (this.micrositie) {
            this.pageForm.value['micrositieId'] = this.micrositie.id;
        }

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
                state: { id: this.micrositie.id },
            });
        } else {
            this._router.navigateByUrl('/admin/modules/pages');
        }
    }

    /**
     * Redirect to page
     */
    redirectPage() {
        window.open(`${this.getDomain()}${this.page.path}`, '_blank');
    }

    /**
     * Get domain
     */
    getDomain() {
        if (this.micrositie)
            return `${this.sitie.domain}/${this.micrositie.path}/`;
        return `${this.sitie.domain}/`;
    }

    /**
     * Valid render permission
     */
    validPermission(code: string) {
        return validAction(code);
    }
}
