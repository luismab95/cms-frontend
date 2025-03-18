import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FileUploadI } from 'app/modules/admin/file-manager/file-manager.types';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileService {
    private url = environment.apiUrl;
    private _httpClient = inject(HttpClient);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Update file
     * @returns
     */
    uploadFile(file: File): Observable<ResponseI<FileUploadI>> {
        const formData = new FormData();
        formData.append('file', file, file.name);

        return this._httpClient.post<ResponseI<FileUploadI>>(
            `${this.url}/ms-file/file/upload`,
            formData
        );
    }

    /**
     * Download file
     * @param url
     * @returns
     */
    downloadFile(url: string): Observable<Blob> {
        return this._httpClient.get(url, { responseType: 'blob' });
    }
}
