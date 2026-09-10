import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SelectionService {
  private readonly _selectedIds = signal<ReadonlySet<string>>(new Set());

  /** All currently-selected node ids (0, 1, or many). */
  readonly selectedIds = computed(() => Array.from(this._selectedIds()));
  readonly hasSelection = computed(() => this._selectedIds().size > 0);
  readonly selectionCount = computed(() => this._selectedIds().size);

  /** Only set when exactly one node is selected — used by the Properties
   *  panel, which shows per-component fields for a single selection and a
   *  "N selected" summary otherwise. */
  readonly selectedNodeId = computed(() => {
    const ids = this._selectedIds();
    return ids.size === 1 ? Array.from(ids)[0] : null;
  });

  /** Selects a single node, replacing any existing selection. Pass
   *  `additive: true` (shift-click) to toggle it into/out of the current
   *  selection instead. */
  select(nodeId: string | null, options?: { additive?: boolean }): void {
    if (nodeId === null) {
      this.clear();
      return;
    }

    if (options?.additive) {
      this._selectedIds.update((current) => {
        const next = new Set(current);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
      return;
    }

    this._selectedIds.set(new Set([nodeId]));
  }

  /** Replaces the selection with an explicit set of ids (e.g. marquee-select
   *  or after duplicating a batch of nodes). */
  selectMany(nodeIds: string[]): void {
    this._selectedIds.set(new Set(nodeIds));
  }

  isSelected(nodeId: string): boolean {
    return this._selectedIds().has(nodeId);
  }

  clear(): void {
    this._selectedIds.set(new Set());
  }
}
