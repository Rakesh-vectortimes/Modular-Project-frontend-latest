import { Component, effect, HostListener, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SelectedPageService } from '../../../core/services/selected-page.service';
import { SelectedSoftwareService } from '../../../core/services/selected-software.service';
import { SelectionService } from '../../../core/services/selection.service';
import { PageBuilderLayoutService } from '../../../core/services/page-builder-layout.service';
import { ShellLayoutService } from '../../../core/services/shell-layout.service';
import { SoftwarePagesStoreService } from '../../../core/services/software-pages-store.service';
import { BuilderStateService } from './builder-state.service';
import { CanvasViewService } from './canvas-view.service';
import {
  provideComponentRendererRegistry,
} from '../../../shared/renderer/component-type-registry';
import { DropListRegistryService } from './drop-list-registry.service';
import { CanvasComponent } from '../canvas/canvas.component';
import { LayersPanelComponent } from '../layers-panel/layers-panel.component';
import { PaletteComponent } from '../palette/palette.component';
import { PropertiesPanelComponent } from '../properties-panel/properties-panel.component';

@Component({
  selector: 'app-page-builder',
  standalone: true,
  imports: [
    FormsModule,
    PaletteComponent,
    CanvasComponent,
    PropertiesPanelComponent,
    LayersPanelComponent,
  ],
  providers: [
    BuilderStateService,
    DropListRegistryService,
    CanvasViewService,
    provideComponentRendererRegistry(),
  ],
  templateUrl: './page-builder.component.html',
  styleUrl: './page-builder.component.scss',
})
export class PageBuilderComponent implements OnDestroy {
  protected readonly selectedPage = inject(SelectedPageService);
  protected readonly selectedSoftware = inject(SelectedSoftwareService);
  protected readonly builderState = inject(BuilderStateService);
  protected readonly layout = inject(PageBuilderLayoutService);
  private readonly pagesStore = inject(SoftwarePagesStoreService);
  private readonly selection = inject(SelectionService);
  private readonly shellLayout = inject(ShellLayoutService);

  protected readonly linkCopied = signal(false);
  protected readonly editingTitle = signal(false);
  protected readonly titleDraft = signal('');
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const page = this.selectedPage.selected();
      if (page) {
        this.layout.enterBuilderMode();
        this.shellLayout.collapseSidebar();
        this.builderState.load(page.id);
      } else {
        this.layout.exitBuilderMode();
        this.builderState.reset();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.copyResetTimer) {
      clearTimeout(this.copyResetTimer);
    }
    this.builderState.reset();
  }

  protected closeBuilder(): void {
    this.selectedPage.clear();
  }

  protected startTitleRename(): void {
    const page = this.selectedPage.selected();
    if (!page) {
      return;
    }
    this.titleDraft.set(page.name);
    this.editingTitle.set(true);
  }

  protected commitTitleRename(): void {
    if (!this.editingTitle()) {
      return;
    }
    const page = this.selectedPage.selected();
    const trimmed = this.titleDraft().trim();
    this.editingTitle.set(false);
    if (!page || !trimmed || trimmed === page.name) {
      return;
    }

    this.pagesStore.rename(page.id, trimmed).subscribe({
      next: (updated) => this.selectedPage.patchSelected({ name: updated.name }),
      error: () => alert('Failed to rename page.'),
    });
  }

  protected cancelTitleRename(): void {
    this.editingTitle.set(false);
  }

  protected save(): void {
    this.builderState.save();
  }

  /** Deletes the selected component(s) on Delete/Backspace, duplicates them on
   *  Ctrl/Cmd+D, unless the user is typing in a text field, textarea, select,
   *  or contenteditable (e.g. the Properties panel) — in that case let the
   *  browser handle the key normally. */
  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isEditableTarget =
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      target?.isContentEditable === true;

    if (isEditableTarget) {
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selectedIds = this.selection.selectedIds();
      if (!selectedIds.length) {
        return;
      }
      event.preventDefault();
      this.builderState.removeNodes(selectedIds);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      const selectedIds = this.selection.selectedIds();
      if (!selectedIds.length) {
        return;
      }
      event.preventDefault();
      this.builderState.duplicateNodes(selectedIds);
      return;
    }

    if (event.key === 'Escape') {
      this.selection.clear();
    }
  }

  /** Opens Run mode for this page in a new tab (design doc §5.2). */
  protected previewUrl(): string | null {
    const softwareId = this.selectedSoftware.selected()?.id;
    const page = this.selectedPage.selected();
    if (!softwareId || !page) {
      return null;
    }
    return `/run/${softwareId}/${page.id}`;
  }

  /** Anonymous public URL for the software's default published page. */
  protected publishUrl(): string | null {
    const softwareId = this.selectedSoftware.selected()?.id;
    if (!softwareId) {
      return null;
    }
    return `/p/${softwareId}`;
  }

  protected copyPublishLink(): void {
    const path = this.publishUrl();
    if (!path) {
      return;
    }
    const absolute = `${window.location.origin}${path}`;
    void navigator.clipboard.writeText(absolute).then(() => {
      this.linkCopied.set(true);
      if (this.copyResetTimer) {
        clearTimeout(this.copyResetTimer);
      }
      this.copyResetTimer = setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }
}
