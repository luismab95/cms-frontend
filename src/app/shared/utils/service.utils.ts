import { GetPageI } from '@core/interfaces/page.interface';
import { PaginationResponseI, PaginationResquestI } from '@shared/interfaces';

export const buildQueryParams = <T extends PaginationResquestI>(params: T): string => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
};

export const buildQueryParamsPage = (params: GetPageI): string => {
  const query = Object.entries(params)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return query ? `?${query}` : '';
};

export const DefaultPaginationParams = <T>(): PaginationResponseI<T> => ({
  records: [] as unknown as T,
  total: 0,
  page: 1,
  totalPage: 0,
});
