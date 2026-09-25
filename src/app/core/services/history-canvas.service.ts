import { Injectable, signal } from '@angular/core';
import { HistoryChangeI, SectionI } from 'app/shared/interfaces/grid.interface';
import { CanvasT } from '../interfaces/page.interface';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly MAX_HISTORY = 10;

  private readonly histories = {
    header: signal<HistoryChangeI[]>([]),
    body: signal<HistoryChangeI[]>([]),
    footer: signal<HistoryChangeI[]>([]),
  };

  private readonly currentIndexes = {
    header: signal(-1),
    body: signal(-1),
    footer: signal(-1),
  };

  readonly canUndo = {
    header: signal(false),
    body: signal(false),
    footer: signal(false),
  };

  readonly canRedo = {
    header: signal(false),
    body: signal(false),
    footer: signal(false),
  };

  /**
   *
   * @param type
   * @param current
   * @param newState
   */
  execute(type: CanvasT, current: SectionI[], newState: SectionI[]): void {
    const previous = structuredClone(current);
    const next = structuredClone(newState);
    this.commit(type, previous, next);
  }

  /**
   * Guarda un cambio en el historial de una sección.
   */
  commit(type: CanvasT, previous: SectionI[], next: SectionI[]): void {
    const history = this.histories[type];
    const currentIndex = this.currentIndexes[type];

    const previousState = structuredClone(previous);
    const nextState = structuredClone(next);

    // Si hicimos undo y luego hacemos un nuevo cambio,
    // eliminamos el historial que estaba por delante.
    if (currentIndex() < history().length - 1) {
      history.update((items) => items.slice(0, currentIndex() + 1));
    }

    history.update((items) => [
      ...items,
      {
        previous: previousState,
        next: nextState,
      },
    ]);

    // Limitar historial
    if (history().length > this.MAX_HISTORY) {
      history.update((items) => items.slice(1));
    }

    currentIndex.set(history().length - 1);

    this.updateAvailability(type);
  }

  /**
   * Undo
   */
  undo(type: CanvasT): SectionI[] | null {
    const history = this.histories[type];
    const currentIndex = this.currentIndexes[type];

    const index = currentIndex();

    if (index < 0) {
      return null;
    }

    const change = history()[index];

    currentIndex.set(index - 1);

    this.updateAvailability(type);

    return structuredClone(change.previous);
  }

  /**
   * Redo
   */
  redo(type: CanvasT): SectionI[] | null {
    const history = this.histories[type];
    const currentIndex = this.currentIndexes[type];

    const nextIndex = currentIndex() + 1;

    if (nextIndex >= history().length) {
      return null;
    }

    const change = history()[nextIndex];

    currentIndex.set(nextIndex);

    this.updateAvailability(type);

    return structuredClone(change.next);
  }

  /**
   * Limpia el historial de una sección.
   */
  clear(type: CanvasT): void {
    this.histories[type].set([]);
    this.currentIndexes[type].set(-1);

    this.updateAvailability(type);
  }

  /**
   * Limpia todos los historiales.
   */
  clearAll(): void {
    this.clear('header');
    this.clear('body');
    this.clear('footer');
  }

  /**
   * Actualiza disponibilidad de undo/redo.
   */
  private updateAvailability(type: CanvasT): void {
    const history = this.histories[type];
    const currentIndex = this.currentIndexes[type];

    const index = currentIndex();

    this.canUndo[type].set(index >= 0);
    this.canRedo[type].set(index < history().length - 1);
  }
}
