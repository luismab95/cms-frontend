import { FieldTypeDefinition } from '@ng-forge/dynamic-forms/integration';
import { tailwindInputField } from './input/input/input-field.config';
import { tailwindSelectField } from './select/select-field.config';
import { tailwindFileField } from './file/file-field.config';
import { tailwindCodeField } from './code/code/code.config';

export const withTailwindFields = (): FieldTypeDefinition[] => [
  tailwindInputField,
  tailwindSelectField,
  tailwindFileField,
  tailwindCodeField,
];
