import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PluginLoaderService {
  private readonly scripts = new Map<string, Promise<void>>();

  load(src: string, pluginName: string): Promise<void> {
    const existing = this.scripts.get(pluginName);

    if (existing) {
      return existing;
    }

    const scriptId = `js-${pluginName}`;

    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      const promise = Promise.resolve();

      this.scripts.set(pluginName, promise);

      return promise;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');

      script.id = scriptId;
      script.src = src;
      script.type = 'text/javascript';
      script.async = true;

      script.onload = () => {
        resolve();
      };

      script.onerror = () => {
        this.scripts.delete(pluginName);

        reject(new Error(`Error al cargar el plugin: ${pluginName}`));
      };

      document.body.appendChild(script);
    });

    this.scripts.set(pluginName, promise);

    return promise;
  }
}
