import { FieldTypeDefinition } from '@ng-forge/dynamic-forms/integration';
import { valueFieldMapper } from '@ng-forge/dynamic-forms/integration';

export const tailwindInputField: FieldTypeDefinition = {
  name: 'input',
  loadComponent: () => import('./input-field'),
  mapper: valueFieldMapper,
};
