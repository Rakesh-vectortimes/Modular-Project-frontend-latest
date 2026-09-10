import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { PageRead } from '../../core/models';
import { SelectedPageService } from '../../core/services/selected-page.service';
import { SelectedSoftwareService } from '../../core/services/selected-software.service';
import { SoftwarePagesStoreService } from '../../core/services/software-pages-store.service';

@Component({
  selector: 'app-pages-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './pages-tab.component.html',
  styleUrl: './pages-tab.component.scss',
})
export class PagesTabComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly pagesStore = inject(SoftwarePagesStoreService);
  protected readonly selectedSoftware = inject(SelectedSoftwareService);
  protected readonly selectedPage = inject(SelectedPageService);

  protected readonly creating = signal(false);
  protected readonly showCreateForm = signal(false);

  protected readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    is_default: [false],
  });

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

  protected toggleCreateForm(): void {
    this.showCreateForm.update((v) => !v);
    this.createForm.reset({ name: '', is_default: false });
    this.pagesStore.error.set(null);
  }

  protected createPage(): void {
    const software = this.selectedSoftware.selected();
    if (!software || this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const { name, is_default } = this.createForm.getRawValue();

    this.creating.set(true);
    this.pagesStore.error.set(null);

    this.pagesStore
      .create({ name, is_default, software_id: software.id })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (page) => {
          this.showCreateForm.set(false);
          this.createForm.reset({ name: '', is_default: false });
          this.selectedPage.select(page);
        },
        error: () => this.pagesStore.error.set('Failed to create page.'),
      });
  }

  protected setDefault(page: PageRead, event: Event): void {
    event.stopPropagation();

    if (page.is_default) {
      return;
    }

    this.pagesStore.setDefault(page.id).subscribe({
      error: () => this.pagesStore.error.set('Failed to set default page.'),
    });
  }

  protected openPage(page: PageRead): void {
    this.selectedPage.select(page);
  }

  protected isPageOpen(page: PageRead): boolean {
    return this.selectedPage.selected()?.id === page.id;
  }

  protected deletePage(page: PageRead, event: Event): void {
    event.stopPropagation();

    if (!confirm(`Delete page "${page.name}"?`)) {
      return;
    }

    this.pagesStore.remove(page.id).subscribe({
      next: () => {
        if (this.selectedPage.selected()?.id === page.id) {
          this.selectedPage.clear();
        }
      },
      error: () => this.pagesStore.error.set('Failed to delete page.'),
    });
  }
}
