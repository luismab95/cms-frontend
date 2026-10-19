export interface PermissionSitieI {
  id: number;
  userId: number;
  sitieId: number | null;
  micrositieId: number | null;
  status: boolean;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  roleName: string;
}
