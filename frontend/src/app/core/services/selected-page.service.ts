import { Injectable, signal } from '@angular/core';

import { PageRead } from '../models';

@Injectable({ providedIn: 'root' })
export class SelectedPageService {
  private readonly _selected = signal<PageRead | null>(null);

  readonly selected = this._selected.asReadonly();

  select(page: PageRead): void {
    this._selected.set(page);
  }

  /** Keep toolbar / properties in sync after a rename from Layers. */
  patchSelected(patch: Partial<PageRead>): void {
    const current = this._selected();
    if (current) {
      this._selected.set({ ...current, ...patch });
    }
  }

  clear(): void {
    this._selected.set(null);
  }
}
