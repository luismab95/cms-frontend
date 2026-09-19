import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FileI, FilePaginationResquestI } from '../interfaces/file.interface';
import { PaginationResponseI, ResponseI } from 'app/shared/interfaces/response.interface';
import { environment } from 'environments/environment';
import { Observable, ReplaySubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FileManagerService {
  // Private
  private prefix = 'ms-cms';
  private url = environment.apiUrl;
  private _files: ReplaySubject<PaginationResponseI<FileI[]>> = new ReplaySubject<
    PaginationResponseI<FileI[]>
  >(1);

  /**
   * Constructor
   */
  constructor(private _httpClient: HttpClient) {}

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Setter & getter for files
   *
   * @param value
   */
  set files(value: PaginationResponseI<FileI[]>) {
    // Store the value
    this._files.next(value);
  }

  get files$(): Observable<PaginationResponseI<FileI[]>> {
    return this._files.asObservable();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get files
   */
  getFiles(params: FilePaginationResquestI): Observable<ResponseI<PaginationResponseI<FileI[]>>> {
    let queryParams: string = `?limit=${params.limit}&page=${params.page}&`;
    if (params.search !== null) queryParams += `search=${params.search}&`;
    if (params.status !== null) queryParams += `status=${params.status}&`;
    if (params.mimeType !== null) queryParams += `mimeType=${params.mimeType}&`;

    return this._httpClient
      .get<ResponseI<PaginationResponseI<FileI[]>>>(
        `${this.url}/${this.prefix}/files${queryParams}`,
      )
      .pipe(
        tap((response) => {
          this._files.next(response.message);
        }),
      );
  }

  /**
   * Create the file
   *
   * @param user
   */
  create(file: FileI): Observable<ResponseI<string>> {
    return this._httpClient.post<ResponseI<string>>(`${this.url}/${this.prefix}/files`, {
      ...file,
    });
  }

  /**
   * Delete the file
   *
   * @param fileId
   */
  delete(fileId: number): Observable<ResponseI<string>> {
    return this._httpClient.delete<ResponseI<string>>(`${this.url}/${this.prefix}/files/${fileId}`);
  }

  /**
   * Update the file
   *
   * @param fileId
   * @param file
   */
  update(fileId: number, file: FileI): Observable<ResponseI<string>> {
    return this._httpClient.patch<ResponseI<string>>(`${this.url}/${this.prefix}/files/${fileId}`, {
      ...file,
    });
  }
}
