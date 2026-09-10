import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageBuilderLayoutService {
  readonly pagesSidebarOpen = signal(true);
  readonly toolsPanelOpen = signal(true);
  readonly propertiesPanelOpen = signal(true);

  togglePagesSidebar(): void {
    this.pagesSidebarOpen.update((v) => !v);
  }

  toggleToolsPanel(): void {
    this.toolsPanelOpen.update((v) => !v);
  }

  togglePropertiesPanel(): void {
    this.propertiesPanelOpen.update((v) => !v);
  }

  /** Maximize canvas when a page is opened for editing. */
  enterBuilderMode(): void {
    this.pagesSidebarOpen.set(false);
    this.toolsPanelOpen.set(true);
    this.propertiesPanelOpen.set(true);
  }

  exitBuilderMode(): void {
    this.pagesSidebarOpen.set(true);
    this.toolsPanelOpen.set(true);
    this.propertiesPanelOpen.set(true);
  }
}
