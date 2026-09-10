import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { UserRead, UserRole, UserStatus } from '../../../core/models/auth.model';
import { UserCreate, UserUpdate } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

type ModalMode = 'create' | 'edit' | 'view' | null;

@Component({
  selector: 'app-employee-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './employee-settings.component.html',
  styleUrl: './employee-settings.component.scss',
})
export class EmployeeSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  protected readonly auth = inject(AuthService);

  protected readonly users = signal<UserRead[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly modalMode = signal<ModalMode>(null);
  protected readonly activeUser = signal<UserRead | null>(null);

  protected readonly search = signal('');
  protected readonly filterRole = signal<UserRole | ''>('');
  protected readonly filterStatus = signal<UserStatus | ''>('');

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly roles: UserRole[] = ['super_admin', 'admin', 'member'];
  protected readonly statuses: UserStatus[] = ['active', 'inactive'];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    email: ['', [Validators.required, Validators.email]],
    mobile: [''],
    role: ['member' as UserRole, Validators.required],
    status: ['active' as UserStatus, Validators.required],
    password: [''],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService
      .list({
        search: this.search() || undefined,
        role: this.filterRole() || undefined,
        status: this.filterStatus() || undefined,
        page: this.page(),
        page_size: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.users.set(response.items);
          this.total.set(response.total);
          this.page.set(response.page);
          this.pageSize.set(response.page_size);
        },
        error: () => this.error.set('Failed to load employees.'),
      });
  }

  protected applyFilters(): void {
    this.page.set(1);
    this.loadUsers();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.filterRole.set('');
    this.filterStatus.set('');
    this.page.set(1);
    this.loadUsers();
  }

  protected onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value));
    this.page.set(1);
    this.loadUsers();
  }

  protected previousPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadUsers();
    }
  }

  protected nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.loadUsers();
    }
  }

  protected serialNumber(index: number): number {
    return (this.page() - 1) * this.pageSize() + index + 1;
  }

  protected openCreate(): void {
    this.modalMode.set('create');
    this.activeUser.set(null);
    this.form.reset({
      name: '',
      email: '',
      mobile: '',
      role: 'member',
      status: 'active',
      password: '',
    });
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
  }

  protected openView(user: UserRead): void {
    this.modalMode.set('view');
    this.activeUser.set(user);
    this.patchForm(user, false);
  }

  protected openEdit(user: UserRead): void {
    this.modalMode.set('edit');
    this.activeUser.set(user);
    this.patchForm(user, true);
    this.form.controls.password.clearValidators();
    this.form.controls.password.updateValueAndValidity();
  }

  protected closeModal(): void {
    this.modalMode.set(null);
    this.activeUser.set(null);
    this.form.enable();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    const mode = this.modalMode();
    if (mode === 'create') {
      const payload: UserCreate = {
        name: raw.name,
        email: raw.email,
        mobile: raw.mobile || null,
        role: raw.role,
        status: raw.status,
        password: raw.password,
      };
      this.userService
        .create(payload)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => {
            this.closeModal();
            this.loadUsers();
          },
          error: () => this.error.set('Failed to create employee.'),
        });
      return;
    }

    if (mode === 'edit' && this.activeUser()) {
      const payload: UserUpdate = {
        name: raw.name,
        email: raw.email,
        mobile: raw.mobile || null,
        role: raw.role,
        status: raw.status,
      };
      if (raw.password) {
        payload.password = raw.password;
      }
      this.userService
        .update(this.activeUser()!.id, payload)
        .pipe(finalize(() => this.saving.set(false)))
        .subscribe({
          next: () => {
            this.closeModal();
            this.loadUsers();
          },
          error: () => this.error.set('Failed to update employee.'),
        });
    }
  }

  protected deleteUser(user: UserRead): void {
    if (!confirm(`Delete employee "${user.name}"?`)) {
      return;
    }
    this.userService.delete(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.error.set('Failed to delete employee.'),
    });
  }

  protected roleLabel(role: UserRole): string {
    return role.replace('_', ' ');
  }

  protected isReadonly(): boolean {
    return this.modalMode() === 'view';
  }

  private patchForm(user: UserRead, editable: boolean): void {
    this.form.patchValue({
      name: user.name,
      email: user.email,
      mobile: user.mobile ?? '',
      role: user.role,
      status: user.status,
      password: '',
    });
    if (!editable) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }
}
