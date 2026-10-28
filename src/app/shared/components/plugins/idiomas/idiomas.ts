import { Component, effect, input, output, signal } from '@angular/core';
import { ElementWrappeComponent } from '@shared/components/element-wrapper/element-wrapper';
import { LanguageI, PluginPropertiesI } from '@shared/interfaces';

@Component({
  selector: 'idiomas-plugin',
  templateUrl: './idiomas.html',
  imports: [ElementWrappeComponent],
})
export class IdiomasPlugin {
  element = input.required<PluginPropertiesI>();
  preview = input.required<boolean>();
  isInReviewMode = input.required<boolean>();
  selectElementEvent = output<string>();

  readonly isOpen = signal<boolean>(false);
  readonly languages = signal<LanguageI[]>([]);
  readonly currentLanguage = signal<LanguageI | null>(null);

  private readonly fallbackLanguages: LanguageI[] = [
    {
      lang: 'es',
      name: 'Español',
      icon: 'https://flagcdn.com/w40/ec.png',
      sitieId: 1,
    },
  ];

  /***
   *  Constructor
   */
  constructor() {
    effect(() => {
      const element = this.element();
      if (!element) {
        this.languages.set([]);
        this.currentLanguage.set(null);
        return;
      }

      const sourceLanguages = (
        Array.isArray(element.dataServices.service) ? element.dataServices.service : []
      ) as LanguageI[];

      const languages = sourceLanguages.length > 0 ? sourceLanguages : this.fallbackLanguages;
      this.languages.set(languages);
      const requestedLang = String(element.lang || 'es');
      const selected =
        languages.find((item) => item.lang.toLowerCase() === requestedLang.toLowerCase()) ??
        languages[0] ??
        null;

      this.currentLanguage.set(selected);
      this.isOpen.set(false);
    });
  }

  /**
   * Emit event to select
   * @param uuid
   */
  selectElement(uuid: string) {
    this.selectElementEvent.emit(uuid);
  }

  /**
   * Toggle language switch
   * @param event
   * @returns
   */
  toggleDropdown(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.languages().length) {
      return;
    }

    this.isOpen.update((open) => !open);
  }

  /**
   * Select language
   * @param language
   */
  selectLanguage(language: LanguageI): void {
    this.currentLanguage.set(language);
    this.isOpen.set(false);

    this.changeLanguage(language.lang);
  }

  /**
   * Close language switch
   */
  closeDropdown(): void {
    this.isOpen.set(false);
  }

  /**
   *
   * @param event
   */
  onFocusOut(event: FocusEvent): void {
    const root = event.currentTarget as HTMLElement;
    const nextTarget = event.relatedTarget as Node | null;

    if (!nextTarget || !root.contains(nextTarget)) {
      this.closeDropdown();
    }
  }

  /**
   *
   * @param event
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      this.closeDropdown();

      (event.currentTarget as HTMLElement)
        .querySelector<HTMLButtonElement>('.language-toggle')
        ?.focus();
    }
  }

  /**
   * Change language
   * @param lang
   */
  private changeLanguage(lang: string): void {
    const url = new URL(window.location.href);
    const segments = url.pathname.split('/');

    const languagePattern = /^[a-zA-Z]{2,3}(?:-[a-zA-Z]{2,4})?$/;

    if (segments[1] && languagePattern.test(segments[1])) {
      segments[1] = lang;
    } else {
      segments.splice(1, 0, lang);
    }

    url.pathname = segments.join('/');

    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  /**
   * Get safe image
   * @param value
   * @returns
   */
  private safeImageUrl(value: unknown): string | null {
    if (typeof value !== 'string' || !value.trim()) return null;

    try {
      const url = new URL(value, window.location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }
}
