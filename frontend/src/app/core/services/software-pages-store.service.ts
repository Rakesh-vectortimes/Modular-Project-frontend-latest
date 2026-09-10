import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';

import { PageCreate, PageRead } from '../models';
import { PageService } from './page.service';

/** Shared page list for the current software — keeps sidebar & layers in sync. */
@Injectable({ providedIn: 'root' })
export class SoftwarePagesStoreService {
  private readonly pageService = inject(PageService);

  private softwareId: string | null = null;

  readonly pages = signal<PageRead[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(softwareId: string): void {
    this.softwareId = softwareId;
    this.loading.set(true);
    this.error.set(null);

    this.pageService
      .list(softwareId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.pages.set(items),
        error: () => this.error.set('Failed to load pages.'),
      });
  }

  clear(): void {
    this.softwareId = null;
    this.pages.set([]);
    this.error.set(null);
  }

  create(payload: PageCreate): Observable<PageRead> {
    return this.pageService.create(payload).pipe(
      tap((page) => this.pages.update((list) => [...list, page])),
    );
  }

  rename(pageId: string, name: string): Observable<PageRead> {
    return this.pageService.update(pageId, { name }).pipe(
      tap((updated) =>
        this.pages.update((list) => list.map((p) => (p.id === pageId ? updated : p))),
      ),
    );
  }

  setDefault(pageId: string): Observable<PageRead> {
    return this.pageService.setDefault(pageId).pipe(
      tap((updated) =>
        this.pages.update((list) =>
          list.map((p) => ({
            ...p,
            is_default: p.id === updated.id,
          })),
        ),
      ),
    );
  }

  remove(pageId: string): Observable<void> {
    return this.pageService.delete(pageId).pipe(
      tap(() => this.pages.update((list) => list.filter((p) => p.id !== pageId))),
    );
  }

  refresh(): void {
    if (this.softwareId) {
      this.load(this.softwareId);
    }
  }
}
