import { RoleT } from './user.interface';

export interface SitieI {
  id?: number;
  name: string;
  description: string;
  domain: string;
  templateId: number;
  status: boolean;
  maintenance: boolean;
}

export interface SitieRolesI {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: RoleT;
  roleName: string;
}
