export interface InitializerI {
  id: number;
  hash: string;
  status: boolean;
  userPwd: boolean;
  users?: InitialUserI[];
}

export interface InitialUserI {
  id: number;
  email: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  roleDescription: string;
  password: string;
  passwordConfirm: string;
}
