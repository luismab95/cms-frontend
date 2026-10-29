import { Component, input, signal, effect, output } from '@angular/core';
import { ReviewCommentI } from '@core/interfaces';
import { ElementWrappeComponent } from '@shared/components/element-wrapper/element-wrapper';
import { PluginPropertiesI } from '@shared/interfaces';

@Component({
  selector: 'imagen-plugin',
  templateUrl: './imagen.html',
  imports: [ElementWrappeComponent],
})
export class ImagenPlugin {
  element = input.required<PluginPropertiesI>();
  preview = input.required<boolean>();
  isInReviewMode = input.required<boolean>();
  comments = input.required<ReviewCommentI[]>();
  selectElementEvent = output<string>();

  imagenDefaultSvg = signal<string>(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
      <rect width="300" height="200" fill="#f9fafb"/>
      <g transform="translate(150 75)">
        <rect x="-35" y="-25" width="70" height="50" rx="6" fill="none" stroke="#9ca3af" stroke-width="3"/>
        <circle cx="-12" cy="-8" r="6" fill="#9ca3af"/>
        <path d="M-30 18 L-8 -2 L5 10 L15 0 L30 18" fill="none" stroke="#9ca3af" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <text x="150" y="145" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">Sin imagen</text>
    </svg>
  `);
  alt = signal<string>('');
  src = signal<string>('');

  /**
   * Constructor
   */
  constructor() {
    effect(() => {
      const element = this.element();
      if (!element) return;
      const imagePath = String(element.config['image']);
      this.alt.set(String(element.text['alt']));
      const fallback = this.fallbackUrl();
      const imageUrl = this.imagenSafeUrl(imagePath, element.urlStatics);
      this.src.set(imageUrl ?? fallback);
    });
  }

  /**
   * Get fallbackUrl
   * @returns
   */
  fallbackUrl(): string {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(this.imagenDefaultSvg())}`;
  }

  /**
   * Get sage url image
   * @param value
   * @param baseUrl
   * @returns
   */
  imagenSafeUrl(value: string, baseUrl: string) {
    try {
      const base = baseUrl
        ? new URL(baseUrl, window.location.origin)
        : new URL('/', window.location.origin);
      const url = new URL(value.trim().replace(/\\/g, '/'), base);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  /**
   * Emit event to select
   * @param uuid
   */
  selectElement(uuid: string) {
    this.selectElementEvent.emit(uuid);
  }
}
