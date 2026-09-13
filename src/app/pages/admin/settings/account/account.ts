import { Component, OnInit, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { UserService } from 'app/core/services/user.service';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';
import { UserI } from 'app/core/interfaces/user.interface';

@Component({
  selector: 'settings-account',
  templateUrl: './account.html',
  imports: [FormsModule, ReactiveFormsModule],
})
export class SettingsAccountComponent implements OnInit {
  user = input.required<UserI>();
  edit = input.required<boolean>();

  accountForm!: UntypedFormGroup;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private readonly _userService = inject(UserService);
  private readonly _toastrService = inject(ToastrService);
  private readonly _formBuilder = inject(UntypedFormBuilder);

  readonly role = toSignal(this._userService.role$, { initialValue: null });

  /**
   * Constructor
   */
  constructor() {}

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Create the form
    this.accountForm = this._formBuilder.group({
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roleId: ['', Validators.required],
    });

    this.accountForm.patchValue({ ...this.user(), roleId: this.role()!.id });
    if (!this.edit()) this.accountForm.disable();
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
   * Save action
   */
  save() {
    // Return if the form is invalid
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.accountForm.disable();

    this._userService
      .update(this.user().id!, this.accountForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.accountForm.enable();
          this._toastrService.success(
            'El perfil se actualizó correctamente.',
            'Perfil actualizado',
          );
        },
        error: (response) => {
          this.accountForm.enable();
          this.accountForm.reset();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar la configuración del perfil.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Cancel action
   */
  cancel() {
    this.accountForm.reset();
    this.accountForm.patchValue({ ...this.user(), roleId: this.role()!.id });
  }
}
