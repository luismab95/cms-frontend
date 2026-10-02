import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FileUploadI } from '@core/interfaces';
import { ResponseI } from '@shared/interfaces';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileService {
  private readonly prefix = 'ms-file';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Upload file
   * @param file
   * @param saveInfo
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
