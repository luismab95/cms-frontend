import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { FileI, FilePaginationResquestI } from '@core/interfaces';
import { PaginationResponseI, ResponseI } from '@shared/interfaces';
import { buildQueryParams, DefaultPaginationParams } from '@shared/utils';
import { environment } from 'environments/environment';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileManagerService {
  files = signal<PaginationResponseI<FileI[]>>(DefaultPaginationParams<FileI[]>());

  private readonly prefix = 'ms-cms';
  private readonly url = environment.apiUrl;

  private readonly _httpClient = inject(HttpClient);

  /**
   * Get files
   * @param params
   * @returns
   */
  getFiles(params: FilePaginationResquestI): Observable<ResponseI<PaginationResponseI<FileI[]>>> {
    const queryParams = buildQueryParams(params);
    return this._httpClient
      .get<ResponseI<PaginationResponseI<FileI[]>>>(
        `${this.url}/${this.prefix}/files${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this.files.set(response.message);
        }),
      );
  }

  /**
   * Create the file
   * @param user
   * @returns
   */
  create(file: FileI): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(`${this.url}/${this.prefix}/files`, {
      ...file,
    });
  }

  /**
   * Delete the file
   * @param fileId
   * @returns
   */
  delete(fileId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(`${this.url}/${this.prefix}/files/${fileId}`);
  }

  /**
   * Update the file
   * @param fileId
   * @param file
   * @returns
   */
  update(fileId: number, file: FileI): Observable<ResponseI<string>> {
    return this._httpClient.patch<ResponseI<string>>(`${this.url}/${this.prefix}/files/${fileId}`, {
      ...file,
    });
  }
}
