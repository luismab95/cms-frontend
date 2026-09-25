import { inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  HistoryChangeI,
  HistoryCMSI,
  PageElementsConfigI,
  SectionI,
} from 'app/shared/interfaces/grid.interface';
import { TemplateService } from './templates.service';
import { PageService } from './pages.service';
import { CanvasT } from '../interfaces/page.interface';

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  private readonly MAX_HISTORY = 10;

  private readonly history = signal<HistoryChangeI[]>([]);
  private readonly currentIndex = signal(-1);
  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  private readonly _pageService = inject(PageService);
  private readonly _templateService = inject(TemplateService);

  readonly page = toSignal(this._pageService.page$, { initialValue: null });
  readonly template = toSignal(this._templateService.template$, { initialValue: null });

  readonly sectionsByType = {
    page: {
      get: () => this.page()?.data!.body.data ?? [],
      set: (sections: SectionI[]) => {
        const page = this.page();
        if (!page) return;
        this._pageService.page = {
          ...page,
          data: {
            ...page.data,
            body: {
              ...page.data!.body,
              data: sections,
            },
          },
        };
      },
    },
    header: {
      get: () => this.template()?.data!.header.data ?? [],
      set: (sections: SectionI[]) => {
        const template = this.template();
        if (!template) return;
        this._templateService.template = {
          ...template,
          data: {
            ...template.data!,
            header: {
              ...template.data!.header,
              data: sections,
            },
          },
        };
      },
    },
    footer: {
      get: () => this.template()?.data!.footer.data ?? [],
      set: (sections: SectionI[]) => {
        const template = this.template();
        if (!template) return;
        this._templateService.template = {
          ...template,
          data: {
            ...template.data!,
            footer: {
              ...template.data!.footer,
              data: sections,
            },
          },
        };
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
        this._pageService.page = {
          ...page,
          data: {
            ...page.data,
            body: {
              ...page.data!.body,
              css: pageElementsConfig.css,
              config: pageElementsConfig.config,
            },
          },
        };
      },
    },
    header: {
      get: () => this.template()!.data!.header,
      set: (pageElementsConfig: PageElementsConfigI) => {
        const template = this.template();
        if (!template) return;
        this._templateService.template = {
          ...template,
          data: {
            ...template.data!,
            header: {
              ...template.data!.header,
              css: pageElementsConfig.css,
              config: pageElementsConfig.config,
            },
          },
        };
      },
    },
    footer: {
      get: () => this.template()!.data!.footer,
      set: (pageElementsConfig: PageElementsConfigI) => {
        const template = this.template();
        if (!template) return;
        this._templateService.template = {
          ...template,
          data: {
            ...template.data!,
            footer: {
              ...template.data!.footer,
              css: pageElementsConfig.css,
              config: pageElementsConfig.config,
            },
          },
        };
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
   * Guarda un cambio completo del canvas.
   *
   * Puede haber cambios en header, body o footer,
   * pero todos forman parte del mismo historial.
   *
   * @param previous Estado del canvas antes del cambio.
   * @param next Estado del canvas después del cambio.
   */
  commit(previous: HistoryCMSI, next: HistoryCMSI): void {
    const currentIndex = this.currentIndex();
    const previousState = structuredClone(previous);
    const nextState = structuredClone(next);

    // Si hicimos undo y luego hacemos un nuevo cambio,
    // eliminamos todo lo que estaba por delante.
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

    // Limitar historial
    if (this.history().length > this.MAX_HISTORY) {
      this.history.update((items) => items.slice(1));
    }

    this.currentIndex.set(this.history().length - 1);

    this.updateAvailability();
  }

  /**
   * Undo.
   *
   * @returns Estado anterior del canvas, o null si no hay cambios que deshacer.
   */
  undo(): HistoryCMSI | null {
    const index = this.currentIndex();

    if (index < 0) {
      return null;
    }

    const change = this.history()[index];

    this.currentIndex.set(index - 1);

    this.updateAvailability();

    return structuredClone(change.previous);
  }

  /**
   * Redo.
   *
   * @returns Siguiente estado del canvas, o null si no hay cambios que rehacer.
   */
  redo(): HistoryCMSI | null {
    const nextIndex = this.currentIndex() + 1;

    if (nextIndex >= this.history().length) {
      return null;
    }

    const change = this.history()[nextIndex];

    this.currentIndex.set(nextIndex);

    this.updateAvailability();

    return structuredClone(change.next);
  }

  /**
   * Limpia todo el historial.
   */
  clear(): void {
    this.history.set([]);

    this.currentIndex.set(-1);

    this.updateAvailability();
  }

  /**
   * Actualiza disponibilidad de undo/redo.
   */
  private updateAvailability(): void {
    const index = this.currentIndex();
    const length = this.history().length;

    this.canUndo.set(index >= 0);
    this.canRedo.set(index < length - 1);
  }
}
