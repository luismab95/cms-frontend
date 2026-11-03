import { RoleT } from '@core/interfaces';

export interface ResponseI<T> {
  message: T;
  statusCode: number;
  error?: string;
}

export interface PaginationResponseI<T> {
  records: T;
  total: number;
  page: number;
  totalPage: number;
}

export interface PaginationResquestI {
  page: number;
  limit: number;
  search: string | null;
  status: boolean | null;
}

export interface TableSearchI {
  search: string;
  status: boolean | null;
}

export interface TableRoleSearchI {
  role: RoleT | null;
  search: string;
  filter: string;
  asignRole: RoleT;
  users: number[];
}

export enum StatusCodeE {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}
