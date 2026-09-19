import { valueFieldMapper } from '@ng-forge/dynamic-forms/integration';
import { FieldTypeDefinition } from '@ng-forge/dynamic-forms/internal';

export const tailwindFileField: FieldTypeDefinition = {
  name: 'file',
  loadComponent: () => import('./file-field'),
  mapper: valueFieldMapper,
};
