import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ShellLayoutService } from '../../core/services/shell-layout.service';
import { UserRole } from '../../core/models/auth.model';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly shellLayout = inject(ShellLayoutService);
  private readonly router = inject(Router);

  protected readonly loggingOut = signal(false);
  protected readonly currentYear = new Date().getFullYear();

  protected readonly mainNav: NavItem[] = [
    { label: 'Software', icon: 'software', route: '/dashboard/software' },
    { label: 'Pages', icon: 'pages', route: '/dashboard/pages' },
  ];

  protected readonly settingsNav: NavItem[] = [
    { label: 'Employee Settings', icon: 'employees', route: '/dashboard/settings/employees' },
  ];

  protected toggleSidebar(): void {
    this.shellLayout.toggleSidebar();
  }

  protected roleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      super_admin: 'Super_admin',
      admin: 'Admin',
      member: 'Member',
    };
    return labels[role];
  }

  protected logout(): void {
    this.loggingOut.set(true);
    this.auth
      .logout()
      .pipe(finalize(() => this.loggingOut.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/login']),
        error: () => void this.router.navigate(['/login']),
      });
  }
}
