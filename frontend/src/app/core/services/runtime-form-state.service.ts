import { Injectable, signal } from '@angular/core';

/**
 * Tracks live input values (keyed by `fieldKey`) for the page currently shown
 * in Run/Preview mode, so a Button's "submit" action has something to send to
 * the page's auto-created data collection (design doc §5/§6).
 */
@Injectable({ providedIn: 'root' })
export class RuntimeFormStateService {
  private readonly _pageId = signal<string | null>(null);
  private readonly _values = signal<Record<string, unknown>>({});

  readonly pageId = this._pageId.asReadonly();
  /** Live map of every input's value keyed by fieldKey — read by formula
   *  bindings (Text/Heading nodes) so bound results recompute reactively. */
  readonly values = this._values.asReadonly();

  /** Call when Run mode navigates to a (possibly new) page — clears stale values. */
  setPage(pageId: string): void {
    if (this._pageId() !== pageId) {
      this._pageId.set(pageId);
      this._values.set({});
    }
  }

  setValue(fieldKey: string, value: unknown): void {
    if (!fieldKey) {
      return;
    }
    this._values.update((current) => ({ ...current, [fieldKey]: value }));
  }

  getValues(): Record<string, unknown> {
    return this._values();
  }

  clear(): void {
    this._values.set({});
  }
}
