export interface FileI {
    id?: number;
    name?: string;
    description: string;
    mimeType?: string;
    size?: number;
    filename?: string;
    status?: boolean;
    path?: string;
    url?: string;
}

export interface FileUploadI {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}
