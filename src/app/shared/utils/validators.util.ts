import { AbstractControl, UntypedFormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CmsValidators {
  /**
   * Check for empty (optional fields) values
   *
   * @param value
   */
  static isEmptyInputValue(value: any): boolean {
    return value == null || value.length === 0;
  }

  /**
   * Must match validator
   *
   * @param controlPath A dot-delimited string values that define the path to the control.
   * @param matchingControlPath A dot-delimited string values that define the path to the matching control.
   */
  static mustMatch(controlPath: string, matchingControlPath: string): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      // Get the control and matching control
      const control = formGroup.get(controlPath);
      const matchingControl = formGroup.get(matchingControlPath);

      // Return if control or matching control doesn't exist
      if (!control || !matchingControl) {
        return null;
      }

      // Delete the mustMatch error to reset the error on the matching control
      if (matchingControl.hasError('mustMatch')) {
        if (matchingControl.errors) {
          delete matchingControl.errors['mustMatch'];
          matchingControl.updateValueAndValidity();
        }
      }

      // Don't validate empty values on the matching control
      // Don't validate if values are matching
      if (
        this.isEmptyInputValue(matchingControl.value) ||
        control.value === matchingControl.value
      ) {
        return null;
      }

      // Prepare the validation errors
      const errors = { mustMatch: true };

      // Set the validation error on the matching control
      matchingControl.setErrors(errors);

      // Return the errors
      return errors;
    };
  }

  static validateFormControl(form: UntypedFormGroup, controlName: string): boolean {
    return form.controls[controlName].invalid && form.controls[controlName].touched;
  }

  static getErrorMessage(form: UntypedFormGroup, controlName: string): string {
    const control = form.controls[controlName];

    if (!form.controls[controlName].touched) return '';
    if (!control || !control.errors) return '';

    const firstErrorKey = Object.keys(control.errors)[0];
    if (!firstErrorKey) return '';

    return errorMessages[firstErrorKey] || 'El valor introducido no es válido.';
  }

  static evaluatePasswordSecurity(password: string) {
    if (!password)
      return {
        score: 0,
        strength: 'Débil',
      };

    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let strength;

    if (score <= 2) {
      strength = 'Débil';
    } else if (score <= 3) {
      strength = 'Media';
    } else if (score <= 5) {
      strength = 'Fuerte';
    } else {
      strength = 'Muy Fuerte';
    }

    return {
      score,
      strength,
    };
  }
}

const errorMessages: Record<string, string> = {
  required: 'Este campo es obligatorio.',
  email: 'Por favor, introduce una dirección de correo electrónico válida.',
  minlength: 'El valor introducido es demasiado corto.',
  maxlength: 'El valor introducido es demasiado largo.',
  pattern: 'El valor introducido no coincide con el patrón requerido.',
  mustMatch: 'Los valores no coinciden.',
};
