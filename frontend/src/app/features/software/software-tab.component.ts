import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { SoftwareRead } from '../../core/models';
import { SelectedSoftwareService } from '../../core/services/selected-software.service';
import { SoftwareService } from '../../core/services/software.service';

@Component({
  selector: 'app-software-tab',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './software-tab.component.html',
  styleUrl: './software-tab.component.scss',
})
export class SoftwareTabComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly softwareService = inject(SoftwareService);
  private readonly selectedSoftware = inject(SelectedSoftwareService);
  private readonly router = inject(Router);

  protected readonly softwareList = signal<SoftwareRead[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly editingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    description: [''],
    category: ['', Validators.maxLength(100)],
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
        next: (items) => this.softwareList.set(items),
        error: () => this.error.set('Failed to load software list.'),
      });
  }

  protected startCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', category: '' });
    this.error.set(null);
  }

  protected startEdit(item: SoftwareRead): void {
    this.editingId.set(item.id);
    this.form.patchValue({
      name: item.name,
      description: item.description ?? '',
      category: item.category ?? '',
    });
    this.error.set(null);
  }

  protected selectSoftware(item: SoftwareRead): void {
    this.selectedSoftware.select(item);
    void this.router.navigate(['/dashboard/pages']);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, description, category } = this.form.getRawValue();
    const payload = {
      name,
      description: description || null,
      category: category || null,
    };

    this.saving.set(true);
    this.error.set(null);

    const id = this.editingId();
    const request$ = id
      ? this.softwareService.update(id, payload)
      : this.softwareService.create(payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.loadSoftware();
        this.selectedSoftware.select(saved);
        this.editingId.set(saved.id);
        this.selectedSoftware.updateSelected(saved);
      },
      error: () => this.error.set('Failed to save software.'),
    });
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
        if (this.editingId() === item.id) {
          this.startCreate();
        }
        this.loadSoftware();
      },
      error: () => this.error.set('Failed to delete software.'),
    });
  }

  protected isSelected(item: SoftwareRead): boolean {
    return this.selectedSoftware.selected()?.id === item.id;
  }
}
