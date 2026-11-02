import { FieldTypeDefinition } from '@ng-forge/dynamic-forms/integration';
import { valueFieldMapper } from '@ng-forge/dynamic-forms/integration';

export const tailwindCodeField: FieldTypeDefinition = {
  name: 'code',
  loadComponent: () => import('./code-field'),
  mapper: valueFieldMapper,
};
