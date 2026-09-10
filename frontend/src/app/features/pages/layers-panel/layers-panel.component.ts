import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { PageRead } from '../../../core/models';
import { SelectedPageService } from '../../../core/services/selected-page.service';
import { SelectedSoftwareService } from '../../../core/services/selected-software.service';
import { SelectionService } from '../../../core/services/selection.service';
import { SoftwarePagesStoreService } from '../../../core/services/software-pages-store.service';
import { BuilderStateService } from '../builder/builder-state.service';
import { LayersTreeNodeComponent } from './layers-tree-node.component';

@Component({
  selector: 'app-builder-layers-panel',
  standalone: true,
  imports: [FormsModule, LayersTreeNodeComponent],
  templateUrl: './layers-panel.component.html',
  styleUrl: './layers-panel.component.scss',
})
export class LayersPanelComponent {
  protected readonly builderState = inject(BuilderStateService);
  protected readonly pagesStore = inject(SoftwarePagesStoreService);
  protected readonly selectedSoftware = inject(SelectedSoftwareService);
  protected readonly selectedPage = inject(SelectedPageService);
  protected readonly selection = inject(SelectionService);

  protected readonly showAddPage = signal(false);
  protected readonly creating = signal(false);
  protected newPageName = '';

  /** Page id currently being inline-renamed. */
  protected readonly editingPageId = signal<string | null>(null);
  protected pageRenameDraft = '';

  constructor() {
    effect(() => {
      const software = this.selectedSoftware.selected();
      if (software) {
        this.pagesStore.load(software.id);
      } else {
        this.pagesStore.clear();
      }
    });
  }

  protected isActivePage(page: PageRead): boolean {
    return this.selectedPage.selected()?.id === page.id;
  }

  protected selectPage(page: PageRead, event?: MouseEvent): void {
    event?.stopPropagation();
    if (this.isActivePage(page)) {
      this.selection.clear();
      return;
    }

    if (this.builderState.dirty()) {
      const ok = confirm('You have unsaved changes on this page. Switch without saving?');
      if (!ok) {
        return;
      }
    }

    this.selectedPage.select(page);
  }

  protected startPageRename(page: PageRead, event: MouseEvent): void {
    event.stopPropagation();
    this.editingPageId.set(page.id);
    this.pageRenameDraft = page.name;
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        `[data-page-rename="${page.id}"]`,
      );
      input?.focus();
      input?.select();
    });
  }

  protected commitPageRename(page: PageRead): void {
    if (this.editingPageId() !== page.id) {
      return;
    }
    const trimmed = this.pageRenameDraft.trim();
    this.editingPageId.set(null);
    if (!trimmed || trimmed === page.name) {
      return;
    }

    this.pagesStore.rename(page.id, trimmed).subscribe({
      next: (updated) => {
        if (this.selectedPage.selected()?.id === page.id) {
          this.selectedPage.patchSelected({ name: updated.name });
        }
      },
      error: () => alert('Failed to rename page.'),
    });
  }

  protected cancelPageRename(): void {
    this.editingPageId.set(null);
  }

  protected toggleAddPage(): void {
    this.showAddPage.update((v) => !v);
    this.newPageName = '';
  }

  protected createPage(): void {
    const software = this.selectedSoftware.selected();
    const name = this.newPageName.trim();
    if (!software || !name) {
      return;
    }

    this.creating.set(true);
    this.pagesStore
      .create({ name, is_default: this.pagesStore.pages().length === 0, software_id: software.id })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (page) => {
          this.showAddPage.set(false);
          this.newPageName = '';
          this.selectedPage.select(page);
        },
        error: () => alert('Failed to create page.'),
      });
  }
}
