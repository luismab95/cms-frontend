import { Injectable, signal } from '@angular/core';
import { HistoryChangeI, SectionI } from 'app/shared/interfaces/grid.interface';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private readonly MAX_HISTORY = 10;

  private history= signal<HistoryChangeI[]> ([]);
  private currentIndex = signal(-1);

  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  /**
   * commit
   * @param previous 
   * @param next
   */
  commit(previous: SectionI[], next: SectionI[]): void {
    const previousState = structuredClone(previous);
    const nextState = structuredClone(next);

    if (this.currentIndex() < this.history().length - 1) {
      this.history.update((history) => history.slice(0, this.currentIndex() + 1));
    }

    this.history.update((history) => [
      ...history,
      { previous: previousState, next: nextState },
    ]);

    if (this.history().length > this.MAX_HISTORY) {
     const history = this.history();
     history.shift();
     this.history.set(history);
    }

    this.currentIndex.set(this.history().length - 1);
    this.updateAvailability();
  }

  /**
   * undo
   * @returns
   */
  undo(): SectionI[] | null {
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
   * redo
   * @returns
   */
  redo(): SectionI[] | null {
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
   * Clear
   */
  clear(): void {
    this.history.set([]);
    this.currentIndex.set(-1);
    this.updateAvailability();
  }

  /**
   * update
   */
  private updateAvailability(): void {
    const index = this.currentIndex();
    this.canUndo.set(index >= 0);
    this.canRedo.set(index < this.history().length - 1);
  }
}
