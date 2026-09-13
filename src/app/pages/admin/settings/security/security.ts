import { NgClass } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from '@iqx-limited/ngx-toastr';
import { UserI } from 'app/core/interfaces/user.interface';
import { ParameterService } from 'app/core/services/parameter.service';
import { UserService } from 'app/core/services/user.service';
import { findParameter } from 'app/shared/utils/parameter.utils';
import { CmsValidators } from 'app/shared/utils/validators.util';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'settings-security',
  templateUrl: './security.html',
  imports: [FormsModule, ReactiveFormsModule, NgClass],
})
export class SettingsSecurityComponent implements OnInit {
  user = input.required<UserI>();
  edit = input.required<boolean>();

  securityForm!: UntypedFormGroup;
  validateFormControl = CmsValidators.validateFormControl;
  getErrorMessage = CmsValidators.getErrorMessage;
  evaluatePasswordSecurity = CmsValidators.evaluatePasswordSecurity;

  longPwd = signal<number>(6);
  mayusPwd = signal<boolean>(false);
  specialPwd = signal<boolean>(false);
  numberPwd = signal<boolean>(false);
  passwordVisible = signal<boolean>(false);
  evaluatePasswordSecurityResult = signal<{ score: number; strength: string }>({
    score: 0,
    strength: '',
  });
  passwordConfirmedVisible = signal<boolean>(false);
  mayusPwdRegex: RegExp = new RegExp('(?=.*[A-Z])');
  specialPwdRegex: RegExp = new RegExp('(?=.*[@#$%^&+=])');
  numberPwdRegex: RegExp = new RegExp('(?=.*\\d)');
  longPwdRegex: RegExp = new RegExp('.{' + this.longPwd() + ',}$');

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  private _userService = inject(UserService);
  private _parameterService = inject(ParameterService);
  private _formBuilder = inject(UntypedFormBuilder);
  private _toastrService = inject(ToastrService);

  readonly parameters = toSignal(this._parameterService.parameter$, { initialValue: [] });

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
    this.securityForm = this._formBuilder.group(
      {
        firstname: ['', Validators.required],
        lastname: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        twoFactorAuth: [true],
        password: [''],
        passwordConfirm: [''],
      },
      {
        validators: CmsValidators.mustMatch('password', 'passwordConfirm'),
      },
    );

    this.securityForm.valueChanges.subscribe((res) => {
      this.evaluatePasswordSecurityResult.set(this.evaluatePasswordSecurity(res.password));
    });
    this.longPwdRegex = new RegExp('.{' + this.longPwd() + ',}$');

    this.securityForm.patchValue({ ...this.user() });
    if (!this.edit()) this.securityForm.disable();

    this.getParameters();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Change value of visibility of password
   */
  togglePasswordVisibility(): void {
    this.passwordVisible.set(!this.passwordVisible());
  }

  /**
   * Change value of visibility of password confirmed
   */
  togglePasswordConfirmedVisibility(): void {
    this.passwordConfirmedVisible.set(!this.passwordConfirmedVisible());
  }

  /**
   * Get value of parameters PWD
   */
  getParameters() {
    this.longPwd.set(Number(findParameter('APP_PWD_LONG', this.parameters())?.value));
    this.mayusPwd.set(findParameter('APP_PWD_MAYUS', this.parameters())?.value === 'true');
    this.specialPwd.set(findParameter('APP_PWD_SPECIAL', this.parameters())?.value === 'true');
    this.numberPwd.set(findParameter('APP_PWD_NUMBER', this.parameters())?.value === 'true');
    this.setParameters();
  }

  /**
   * Set value to parameters PWD
   */
  setParameters() {
    this.securityForm.get('password')?.addValidators(Validators.pattern(this.validatePassword()));
    this.securityForm.updateValueAndValidity();
  }

  /**
   * Build pattern to PWD
   * @returns
   */
  validatePassword(): RegExp {
    let regex = '^';
    if (this.mayusPwd()) regex += '(?=.*[A-Z])';
    if (this.specialPwd()) regex += '(?=.*[@#$%^&+=])';
    if (this.numberPwd()) regex += '(?=.*\\d)';
    regex += '.{' + this.longPwd() + ',}$';
    return new RegExp(regex);
  }

  /**
   * Save action
   */
  save() {
    // Return if the form is invalid
    if (this.securityForm.invalid) {
      this.securityForm.markAllAsTouched();
      return;
    }

    // Disable the form
    this.securityForm.disable();

    if (this.securityForm.value.password == '') {
      delete this.securityForm.value.password;
    }

    delete this.securityForm.value.passwordConfirm;

    this._userService
      .update(this.user().id!, this.securityForm.value)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe({
        next: () => {
          this.securityForm.enable();
          this._toastrService.success(
            'La configuración de seguridad se actualizó correctamente.',
            'Configuración de seguridad actualizada',
          );
        },
        error: (response) => {
          this.securityForm.enable();
          this.securityForm.reset();
          this._toastrService.error(
            response.error?.message || 'No fue posible actualizar la configuración de seguridad.',
            'Error al actualizar',
          );
        },
      });
  }

  /**
   * Cancel action
   */
  cancel() {
    this.securityForm.reset();
    this.securityForm.patchValue({ ...this.user() });
  }

  /**
   * Validate RegExp
   * @param value
   * @param regex
   * @returns
   */
  validateRegex(value: string, regex: RegExp) {
    return regex.test(value);
  }
}
