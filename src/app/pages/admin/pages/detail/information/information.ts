import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { PageDataMongoI } from 'app/core/interfaces/page.interface';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { PageService } from 'app/core/services/pages.service';
import { SitieService } from 'app/core/services/sitie.service';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'pages-information',
  templateUrl: './information.html',
  imports: [FormsModule, ReactiveFormsModule, PermissionComponent],
})
export class PagesInformationComponent implements OnInit, OnDestroy {
  private readonly _formBuilder = inject(UntypedFormBuilder);
  private readonly _sitieService = inject(SitieService);
  private readonly _pageService = inject(PageService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _domSanitizer = inject(DomSanitizer);
  private readonly _router = inject(Router);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  permission = PermissionCode;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  sitie = toSignal(this._sitieService.sitie$, { initialValue: null });
  micrositie = toSignal(this._microsityService.micrositie$, { initialValue: null });
  page = toSignal(this._pageService.page$, {
    initialValue: null,
  });

  pageForm!: UntypedFormGroup;

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * OnInit
   */
  ngOnInit(): void {
    this.pageForm = this._formBuilder.group({
      name: ['', Validators.required],
      path: ['', [Validators.required, Validators.pattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]],
      status: [],
      isHomePage: [],
    });

    const page = this.page();

    if (page) {
      this.pageForm.patchValue({ ...page });
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
   * Go to Sitie
   */
  visit(): void {
    window.open(`${this.getDomain()}${this.page()?.path}`, '_blank');
  }

  /**
   * Go to Canvas
   */
  goToCanvas(): void {
    this._router.navigateByUrl('/admin/content/pages/canvas', {
      state: {
        id: this.page() === null ? 0 : this.page()!.id,
        micrositieId: this.micrositie() !== null ? this.micrositie()!.id : 0,
      },
    });
  }

  /**
   * Get domain
   * @returns
   */
  getDomain() {
    if (this.micrositie() !== null) {
      const micrositiePath = this.micrositie()?.path.split('/')[0];
      return `${this.sitie()!.domain}/${micrositiePath}/`;
    }
    return `${this.sitie()!.domain}/`;
  }

  /**
   * Add page
   * @returns
   */
  create(): void {
    if (this.pageForm.invalid) {
      this.pageForm.markAllAsTouched();
      return;
    }

    this.pageForm.disable();

    // ADD data
    this.pageForm.value.data = {
      body: {
        css: '.body{}',
        data: [],
        config: { backgroundImage: '' },
      },
    } as PageDataMongoI;

    if (this.micrositie() !== null) {
      this.pageForm.value['micrositieId'] = this.micrositie()!.id;
    }

    //Delete status isHomePage
    delete this.pageForm.value.status;
    delete this.pageForm.value.isHomePage;

    this._pageService
      .create(this.pageForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.pageForm.enable();
          this._toastrService.success('La página se creó correctamente.', 'Página actualizada');
        },
        error: (response) => {
          this.pageForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible crear la página.',
            'Error al crear',
          );
        },
      });
  }

  /**
   * Update page
   */
  update() {
    // Return if the form is invalid
    if (this.pageForm.invalid) {
      this.pageForm.markAllAsTouched();
      return;
    }

    const page = this.page();

    if (!page === null) return;

    // Disable the form
    this.pageForm.disable();

    this._pageService
      .update(page?.id!, this.pageForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.pageForm.enable();
          this._toastrService.success(
            'La informacion de la página se actualizó correctamente.',
            'Página actualizada',
          );
        },
        error: (response) => {
          this.pageForm.enable();
          // Set the alert
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar la informacion de la página.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Cancel changes
   */
  cancel(): void {
    const page = this.page();

    this.pageForm.reset();

    if (page) {
      this.pageForm.patchValue({ ...page });
    }
  }

  /**
   * Valid Permission
   * @param code
   * @returns
   */
  validPermission(code: string): boolean {
    return validAction(code);
  }

  /**
   * Safe url
   * @returns
   */
  previewPage() {
    return this._domSanitizer.bypassSecurityTrustResourceUrl(this.getDomain() + this.page()?.path);
  }
}
