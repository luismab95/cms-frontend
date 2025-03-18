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

export class PaginationResquestI {
    page: number;
    limit: number;
    search: string | null;
    status: boolean | null;
}
