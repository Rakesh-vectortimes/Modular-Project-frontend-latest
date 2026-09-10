import { Injectable, computed, signal } from '@angular/core';

import { SoftwareRead } from '../models';

@Injectable({ providedIn: 'root' })
export class SelectedSoftwareService {
  private readonly _selected = signal<SoftwareRead | null>(null);

  readonly selected = this._selected.asReadonly();
  readonly hasSelection = computed(() => this._selected() !== null);

  select(software: SoftwareRead): void {
    this._selected.set(software);
  }

  clear(): void {
    this._selected.set(null);
  }

  updateSelected(software: SoftwareRead): void {
    if (this._selected()?.id === software.id) {
      this._selected.set(software);
    }
  }
}
