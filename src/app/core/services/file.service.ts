import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ResponseI } from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';
import { FileUploadI } from '../interfaces/file.interface';

@Injectable({ providedIn: 'root' })
export class FileService {
  private prefix = 'ms-file';
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
  uploadFile(file: File, saveInfo: boolean = true): Observable<ResponseI<FileUploadI>> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('saveInfo', String(saveInfo));

    return this._httpClient.post<ResponseI<FileUploadI>>(
      `${this.url}/${this.prefix}/file/upload`,
      formData,
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
