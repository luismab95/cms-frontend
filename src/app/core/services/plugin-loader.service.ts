import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PluginLoaderService {
  readonly cache = new Map<string, any>();
  readonly pendingRequests = new Map<string, Promise<any>>();

  private readonly _httpClient = inject(HttpClient);

  /**
   * Load data with cache
   * @param url
   * @returns
   */
  private async loadData(url: string): Promise<any> {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    const pendingRequest = this.pendingRequests.get(url);
    if (pendingRequest) return pendingRequest;

    const request = lastValueFrom(this._httpClient.get(url))
      .then((data) => {
        this.cache.set(url, data);
        return data;
      })
      .catch((error) => {
        console.error(`Error obteniendo datos desde ${url}`, error);
        return null;
      })
      .finally(() => {
        this.pendingRequests.delete(url);
      });

    this.pendingRequests.set(url, request);

    return request;
  }

  /**
   * Clear cache
   * @param url Opcional: URL específica
   */
  clearCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
      return;
    }

    this.cache.clear();
  }
}
