import { Component, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { MicrosityService } from 'app/core/services/micrositie.service';
import { SitieService } from 'app/core/services/sitie.service';
import { PermissionComponent } from 'app/shared/components/permission/permission';
import { PermissionCode, validAction } from 'app/shared/utils/permission.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'microsities-information',
  templateUrl: './information.html',
  imports: [FormsModule, ReactiveFormsModule, PermissionComponent],
})
export class MicrositieInformationComponent implements OnInit {
  private readonly _formBuilder = inject(UntypedFormBuilder);
  private readonly _sitieService = inject(SitieService);
  private readonly _microsityService = inject(MicrosityService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _domSanitizer = inject(DomSanitizer);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  permission = PermissionCode;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  sitie = toSignal(this._sitieService.sitie$, { initialValue: null });
  micrositie = toSignal(this._microsityService.micrositie$, { initialValue: null });

  micrositieForm!: UntypedFormGroup;

  previewDefaultPage = computed(() => {
    const micrositie = this.micrositie();
    return this._domSanitizer.bypassSecurityTrustResourceUrl(
      `${this.sitie()?.domain}/preview/${micrositie?.path}`,
    );
  });

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
    this.micrositieForm = this._formBuilder.group({
      name: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(255)]],
      sitieId: ['', Validators.required],
      status: [],
    });

    const micrositie = this.micrositie();

    if (micrositie) {
      this.micrositieForm.patchValue(micrositie);
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
    const domain = `${this.sitie()?.domain}/${this.micrositie()?.path}`;

    if (domain) {
      window.open(domain, '_blank');
    }
  }

  /**
   * Add micrositie
   * @returns
   */
  create(): void {
    if (this.micrositieForm.invalid) {
      this.micrositieForm.markAllAsTouched();
      return;
    }

    this.micrositieForm.disable();

    // ADD data

    if (this.sitie() !== null) {
      this.micrositieForm.value['sitieId'] = this.sitie()!.id;
    }

    this._microsityService
      .create(this.micrositieForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.micrositieForm.enable();
          this._toastrService.success('El micrositio se creó correctamente.', 'Micrositio creado');
        },
        error: (response) => {
          this.micrositieForm.enable();
          this._toastrService.error(
            response.error?.message || 'No fue posible crear el micrositio.',
            'Error al crear',
          );
        },
      });
  }

  /**
   * Update micrositie
   */
  update() {
    // Return if the form is invalid
    if (this.micrositieForm.invalid) {
      this.micrositieForm.markAllAsTouched();
      return;
    }

    const micrositie = this.micrositie();

    if (!micrositie === null) return;

    // Disable the form
    this.micrositieForm.disable();

    this._microsityService
      .update(micrositie?.id!, this.micrositieForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.micrositieForm.enable();
          this._toastrService.success(
            'La informacion del micrositio se actualizó correctamente.',
            'Micrositio actualizado',
          );
        },
        error: (response) => {
          this.micrositieForm.enable();
          // Set the alert
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar la informacion del micrositio.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Cancel changes
   */
  cancel(): void {
    const micrositie = this.micrositie();

    this.micrositieForm.reset();

    if (micrositie) {
      this.micrositieForm.patchValue(micrositie);
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
}
