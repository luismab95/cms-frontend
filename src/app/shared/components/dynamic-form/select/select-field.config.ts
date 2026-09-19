import { FieldTypeDefinition } from '@ng-forge/dynamic-forms/integration';
import { optionsFieldMapper } from '@ng-forge/dynamic-forms/integration';

export const tailwindSelectField: FieldTypeDefinition = {
  name: 'select',
  loadComponent: () => import('./select-field'),
  mapper: optionsFieldMapper,
};
