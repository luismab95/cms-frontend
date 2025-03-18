import { FuseNavigationItem } from '@fuse/components/navigation';

export interface UserI {
    id?: number;
    firstname: string;
    lastname: string;
    email: string;
    bloqued?: boolean;
    status?: boolean;
    twoFactorAuth?: boolean;
    roleId?: number;
    password?: string;
}

export interface SessionUserI {
    user: UserI;
    role: RoleI;
    permission: PermissionI;
    navigation: FuseNavigationItem[];
}

export interface RoleI {
    id: number;
    name: string;
    description: string;
    status: boolean;
    permissionId: number;
}

export interface PermissionI {
    id: number;
    scope: ScopeInterface[];
    description: string;
    status: boolean;
}

export interface ScopeInterface {
    effect: 'Allow' | 'Denny';
    action: string[];
}
