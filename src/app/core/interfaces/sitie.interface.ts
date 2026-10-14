import { PermissionSitieI } from '@shared/interfaces';
import { RoleT } from './user.interface';

export interface SitieI {
  id?: number;
  name: string;
  description: string;
  domain: string;
  templateId: number;
  status: boolean;
  maintenance: boolean;
  permissionSitie?: PermissionSitieI[];
}


