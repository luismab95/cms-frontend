import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root',
})
export class DynamicStyleService {
  private readonly styles = new Map<string, HTMLStyleElement>();

  set(id: string, css: string): void {
    let element = this.styles.get(id);

    if (!element) {
      element = document.createElement('style');
      element.id = id;

      document.head.appendChild(element);

      this.styles.set(id, element);
    }

    element.textContent = css;
  }

  remove(id: string): void {
    const element = this.styles.get(id);

    if (!element) {
      return;
    }

    element.remove();
    this.styles.delete(id);
  }
}
