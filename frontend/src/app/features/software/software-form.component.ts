import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';

import { SoftwareService } from '../../core/services/software.service';
import { SelectedSoftwareService } from '../../core/services/selected-software.service';

@Component({
  selector: 'app-software-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './software-form.component.html',
  styleUrl: './software-form.component.scss',
})
export class SoftwareFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly softwareService = inject(SoftwareService);
  private readonly selectedSoftware = inject(SelectedSoftwareService);

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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      this.loadSoftware(id);
    }
  }

  protected isEditMode(): boolean {
    return this.editingId() !== null;
  }

  private loadSoftware(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.softwareService
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (item) => {
          this.form.patchValue({
            name: item.name,
            description: item.description ?? '',
            category: item.category ?? '',
          });
        },
        error: () => {
          this.error.set('Software not found.');
        },
      });
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
        this.selectedSoftware.select(saved);
        void this.router.navigate(['/dashboard/software']);
      },
      error: () => this.error.set('Failed to save software.'),
    });
  }

  protected cancel(): void {
    void this.router.navigate(['/dashboard/software']);
  }
}
