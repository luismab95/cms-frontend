export interface ParameterI {
  id?: number;
  code: string;
  name?: string;
  description?: string;
  value: string;
  private?: boolean;
}

export interface CompanyParameterFormI {
  name: string;
  description: string;
  website: string;
  urlStatics: string;
  email: string;
  phone: string;
  country: string;
}

export interface LogosParameterFormI {
  primary: string;
  icon: string;
  email: string;
  authBackground: string;
}

export interface EmailParameterFormI {
  host: string;
  port: string;
  username: string;
  password: string;
  email: string;
  secure: boolean;
  testEmail: string;
}

export interface SecurityParameterFormI {
  inactivity: string;
  attemps: string;
  pwdLong: string;
  pwdNumber: boolean;
  pwdMayus: boolean;
  pwdSpecial: boolean;
  optTime: string;
  otpLong: string;
  otpType: string;
}
