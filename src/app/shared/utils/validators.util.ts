import { FieldTree } from '@angular/forms/signals';

/**
 * Is valid field
 * @param field
 * @returns
 */
export function hasErrorFormField<T>(field: FieldTree<T>): boolean {
  return field().invalid() && field().touched();
}

/**
 * Evaluate security password
 * @param password
 * @returns
 */
export function evaluatePasswordSecurity(password: string) {
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
