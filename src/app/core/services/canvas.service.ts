import { inject, Injectable, signal } from '@angular/core';
import { CanvasT } from '@core/interfaces';
import {
  HistoryChangeI,
  SelectedItemsInGridI,
  SectionI,
  PageElementsConfigI,
  HistoryCMSI,
} from '@shared/interfaces';
import { PageService, TemplateService } from '@core/services';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  private readonly MAX_HISTORY = 40;

  private readonly history = signal<HistoryChangeI[]>([]);
  private readonly currentIndex = signal(-1);
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);
  readonly selectedItemsInGrid = signal<SelectedItemsInGridI | null>(null);

  private readonly _pageService = inject(PageService);
  private readonly _templateService = inject(TemplateService);

  readonly page = this._pageService.page;
  readonly template = this._templateService.template;

  readonly sectionsByType = {
    page: {
      get: () => this.page()?.data!.body.data ?? [],
      set: (sections: SectionI[]) => {
        const page = this.page();
        if (!page) return;
        this._pageService.page.set({
          ...page,
          data: {
            ...page.data,
            body: {
              ...page.data!.body,
              data: sections,
            },
          },
        });
      },
    },
    header: {
      get: () => this.template()?.data!.header.data ?? [],
      set: (sections: SectionI[]) => {
        const template = this.template();
        if (!template) return;
        this._templateService.template.set({
          ...template,
          data: {
            ...template.data!,
            header: {
              ...template.data!.header,
              data: sections,
            },
          },
        });
      },
    },
    footer: {
      get: () => this.template()?.data!.footer.data ?? [],
      set: (sections: SectionI[]) => {
        const template = this.template();
        if (!template) return;
        this._templateService.template.set({
          ...template,
          data: {
            ...template.data!,
            footer: {
              ...template.data!.footer,
              data: sections,
            },
          },
        });
      },
    },
  } satisfies Record<
    CanvasT,
    {
      get: () => SectionI[];
      set: (sections: SectionI[]) => void;
    }
  >;
  readonly configByType = {
    page: {
      get: () => this.page()!.data!.body,
      set: (pageElementsConfig: PageElementsConfigI) => {
        const page = this.page();
        if (!page) return;
        this._pageService.page.set({
          ...page,
          data: {
            ...page.data,
            body: {
              ...page.data!.body,
              css: pageElementsConfig.css,
              config: pageElementsConfig.config,
            },
          },
        });
      },
    },
    header: {
      get: () => this.template()!.data!.header,
      set: (pageElementsConfig: PageElementsConfigI) => {
        const template = this.template();
        if (!template) return;
        this._templateService.template.set({
          ...template,
          data: {
            ...template.data!,
            header: {
              ...template.data!.header,
              css: pageElementsConfig.css,
              config: pageElementsConfig.config,
            },
          },
        });
      },
    },
    footer: {
      get: () => this.template()!.data!.footer,
      set: (pageElementsConfig: PageElementsConfigI) => {
        const template = this.template();
        if (!template) return;
        this._templateService.template.set({
          ...template,
          data: {
            ...template.data!,
            footer: {
              ...template.data!.footer,
              css: pageElementsConfig.css,
              config: pageElementsConfig.config,
            },
          },
        });
      },
    },
  } satisfies Record<
    CanvasT,
    {
      get: () => PageElementsConfigI;
      set: (pageElementsConfig: PageElementsConfigI) => void;
    }
  >;

  /**
   * Update changes
   * @param previous
   * @param next
   */
  updateChangesPageConfigInCanvas(gridType: CanvasT, config: { [key: string]: any }) {
    const source = (gridType === 'page' ? this.page()?.data : this.template()?.data) as any;
    const currentConfig: { [key: string]: any } =
      source[gridType === 'page' ? 'body' : gridType].config;
    if (!source) return;

    const createHistory = (config: { [key: string]: any }): HistoryCMSI => ({
      header:
        gridType === 'header'
          ? { ...source.header, config }
          : gridType === 'page'
            ? null
            : source.header,
      body: gridType === 'page' ? { ...source.body, config } : null,
      footer:
        gridType === 'footer'
          ? { ...source.footer, config }
          : gridType === 'page'
            ? null
            : source.footer,
    });
    this.commit(createHistory(currentConfig), createHistory(config));
  }

  /**
   * Update changes
   * @param previous
   * @param next
   */
  updateChangesPageCssInCanvas(gridType: CanvasT, css: string) {
    const source = (gridType === 'page' ? this.page()?.data : this.template()?.data) as any;
    const currentCss: string = source[gridType === 'page' ? 'body' : gridType].css;

    if (!source) return;

    const createHistory = (css: string): HistoryCMSI => ({
      header:
        gridType === 'header'
          ? { ...source.header, css }
          : gridType === 'page'
            ? null
            : source.header,
      body: gridType === 'page' ? { ...source.body, css } : null,
      footer:
        gridType === 'footer'
          ? { ...source.footer, css }
          : gridType === 'page'
            ? null
            : source.footer,
    });

    this.commit(createHistory(currentCss), createHistory(css));
  }

  /**
   * Update changes
   * @param previous
   * @param next
   */
  updateChangesInCanvas(gridType: CanvasT, previous: SectionI[], next: SectionI[]) {
    const source = (gridType === 'page' ? this.page()?.data : this.template()?.data) as any;
    if (!source) return;

    const createHistory = (data: SectionI[]): HistoryCMSI => ({
      header:
        gridType === 'header'
          ? { ...source.header, data }
          : gridType === 'page'
            ? null
            : source.header,
      body: gridType === 'page' ? { ...source.body, data } : null,
      footer:
        gridType === 'footer'
          ? { ...source.footer, data }
          : gridType === 'page'
            ? null
            : source.footer,
    });
    this.commit(createHistory(previous), createHistory(next));
  }

  /**
   * Store a change in the history.
   * @param previous
   * @param next
   */
  commit(previous: HistoryCMSI, next: HistoryCMSI): void {
    const currentIndex = this.currentIndex();
    const previousState = structuredClone(previous);
    const nextState = structuredClone(next);

    if (currentIndex < this.history().length - 1) {
      this.history.update((items) => items.slice(0, currentIndex + 1));
    }

    this.history.update((items) => [
      ...items,
      {
        previous: previousState,
        next: nextState,
      },
    ]);

    if (this.history().length > this.MAX_HISTORY) this.history.update((items) => items.slice(1));
    this.currentIndex.set(this.history().length - 1);
    this.updateAvailability();
  }

  /**
   * Undo
   * @returns
   */
  undo(): HistoryCMSI | null {
    const index = this.currentIndex();
    if (index < 0) return null;
    const change = this.history()[index];
    this.currentIndex.set(index - 1);
    this.updateAvailability();
    return structuredClone(change.previous);
  }

  /**
   * Redo
   * @returns
   */
  redo(): HistoryCMSI | null {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.history().length) return null;
    const change = this.history()[nextIndex];
    this.currentIndex.set(nextIndex);
    this.updateAvailability();
    return structuredClone(change.next);
  }

  /**
   * Clear the history of changes.
   */
  clear(): void {
    this.history.set([]);
    this.currentIndex.set(-1);
    this.updateAvailability();
  }

  /**
   * Update the availability of undo and redo actions based on the current index and history length.
   */
  private updateAvailability(): void {
    const index = this.currentIndex();
    const length = this.history().length;
    this.canUndo.set(index >= 0);
    this.canRedo.set(index < length - 1);
  }
}
