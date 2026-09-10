import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/guards/auth.guard';
import { OAuthCallbackComponent } from './features/auth/oauth-callback.component';
import { LoginComponent } from './features/auth/login.component';
import { DashboardShellComponent } from './features/dashboard/dashboard-shell.component';
import { PagesPageComponent } from './features/dashboard/pages-page.component';
import { EmployeeSettingsComponent } from './features/settings/employees/employee-settings.component';
import { RuntimeShellComponent } from './features/runtime/runtime-shell.component';
import { PublicAppShellComponent } from './features/runtime/public-app-shell.component';
import { SoftwareListComponent } from './features/software/software-list.component';
import { SoftwareFormComponent } from './features/software/software-form.component';

export const routes: Routes = [
  {
    path: 'oauth/callback',
    component: OAuthCallbackComponent,
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    component: DashboardShellComponent,
    children: [
      { path: '', redirectTo: 'software', pathMatch: 'full' },
      { path: 'software', component: SoftwareListComponent },
      { path: 'software/new', component: SoftwareFormComponent },
      { path: 'software/:id/edit', component: SoftwareFormComponent },
      { path: 'pages', component: PagesPageComponent },
      { path: 'settings/employees', component: EmployeeSettingsComponent },
    ],
  },
  {
    path: 'run/:softwareId/:pageId',
    canActivate: [authGuard],
    component: RuntimeShellComponent,
  },
  {
    path: 'run/:softwareId',
    canActivate: [authGuard],
    component: RuntimeShellComponent,
  },
  {
    path: 'p/:softwareId/:pageId',
    component: PublicAppShellComponent,
  },
  {
    path: 'p/:softwareId',
    component: PublicAppShellComponent,
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
