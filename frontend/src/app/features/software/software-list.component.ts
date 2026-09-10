import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { SoftwareRead } from '../../core/models';
import { SelectedSoftwareService } from '../../core/services/selected-software.service';
import { SoftwareService } from '../../core/services/software.service';

@Component({
  selector: 'app-software-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './software-list.component.html',
  styleUrl: './software-list.component.scss',
})
export class SoftwareListComponent implements OnInit {
  private readonly softwareService = inject(SoftwareService);
  private readonly selectedSoftware = inject(SelectedSoftwareService);
  private readonly router = inject(Router);

  protected readonly allItems = signal<SoftwareRead[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly search = signal('');
  protected readonly filterCategory = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);

  protected readonly categories = computed(() => {
    const set = new Set<string>();
    for (const item of this.allItems()) {
      if (item.category?.trim()) {
        set.add(item.category.trim());
      }
    }
    return [...set].sort();
  });

  protected readonly filteredItems = computed(() => {
    const q = this.search().trim().toLowerCase();
    const category = this.filterCategory();
    return this.allItems().filter((item) => {
      const matchesCategory = !category || item.category === category;
      if (!matchesCategory) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [item.name, item.description ?? '', item.category ?? '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  });

  protected readonly total = computed(() => this.filteredItems().length);

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly pagedItems = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filteredItems().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadSoftware();
  }

  protected loadSoftware(): void {
    this.loading.set(true);
    this.error.set(null);

    this.softwareService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.allItems.set(items),
        error: () => this.error.set('Failed to load software list.'),
      });
  }

  protected applyFilters(): void {
    this.page.set(1);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.filterCategory.set('');
    this.page.set(1);
  }

  protected onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.page.set(1);
  }

  protected previousPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  protected nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  protected serialNumber(index: number): number {
    return (this.page() - 1) * this.pageSize() + index + 1;
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
  }

  protected truncate(text: string | null, max = 60): string {
    if (!text?.trim()) {
      return '—';
    }
    return text.length > max ? `${text.slice(0, max)}…` : text;
  }

  protected goToCreate(): void {
    void this.router.navigate(['/dashboard/software/new']);
  }

  protected goToEdit(item: SoftwareRead, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/dashboard/software', item.id, 'edit']);
  }

  protected openPages(item: SoftwareRead): void {
    this.selectedSoftware.select(item);
    void this.router.navigate(['/dashboard/pages']);
  }

  protected deleteSoftware(item: SoftwareRead, event: Event): void {
    event.stopPropagation();

    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) {
      return;
    }

    this.softwareService.delete(item.id).subscribe({
      next: () => {
        if (this.selectedSoftware.selected()?.id === item.id) {
          this.selectedSoftware.clear();
        }
        this.loadSoftware();
      },
      error: () => this.error.set('Failed to delete software.'),
    });
  }
}
