import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';
import { PageDataService } from './page-data.service';
import { PageService } from './page.service';
import { RuntimeContextService } from './runtime-context.service';
import { RuntimeFormStateService } from './runtime-form-state.service';
import { RuntimeToastService } from './runtime-toast.service';
import { findMissingRequiredFields } from '../utils/form-required.util';
import { resolvePostLoginPageId } from '../utils/post-login-page.util';

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ComponentAction {
  actionType?:
    | 'none'
    | 'navigate'
    | 'submit'
    | 'signup'
    | 'login'
    | 'open_url'
    | 'show_message'
    | 'go_back'
    | 'call_api'
    | string;
  targetPageId?: string;
  url?: string;
  openInNewTab?: boolean;
  message?: string;

  /** Field keys for login action (defaults: email, password). */
  emailFieldKey?: string;
  passwordFieldKey?: string;

  apiMethod?: ApiMethod;
  apiUrl?: string;
  apiSendFormData?: boolean;
  successMessage?: string;
}

export interface RuntimeActionContext {
  softwareId: string;
  pageId: string;
}

@Injectable({ providedIn: 'root' })
export class RuntimeActionService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly pageData = inject(PageDataService);
  private readonly pageService = inject(PageService);
  private readonly runtimeContext = inject(RuntimeContextService);
  private readonly formState = inject(RuntimeFormStateService);
  private readonly toast = inject(RuntimeToastService);

  trigger(action: ComponentAction | undefined | null, ctx: RuntimeActionContext): void {
    if (!action || !action.actionType || action.actionType === 'none') {
      return;
    }

    switch (action.actionType) {
      case 'navigate':
        this.navigate(action.targetPageId, ctx.softwareId);
        break;

      case 'open_url':
        if (action.url) {
          window.open(action.url, action.openInNewTab ? '_blank' : '_self');
        }
        break;

      case 'go_back':
        this.location.back();
        break;

      case 'show_message':
        this.toast.show(action.message?.trim() || 'Done.', 'info');
        break;

      case 'submit':
        this.runSubmit(action, ctx);
        break;

      case 'signup':
        this.runSignup(action, ctx);
        break;

      case 'login':
        this.runLogin(action, ctx);
        break;

      case 'call_api':
        this.callApi(action);
        break;
    }
  }

  startSocialLogin(
    provider: string,
    ctx: RuntimeActionContext,
    action?: ComponentAction | null,
  ): void {
    if (provider === 'google') {
      const targetPageId = this.resolveLoginTargetPageId(action);
      this.auth.startGoogleLogin({
        softwareId: ctx.softwareId,
        pageId: ctx.pageId,
        targetPageId,
      });
      return;
    }

    this.toast.show(`${provider} login is not configured yet. Use Google for now.`, 'info');
  }

  private runSubmit(action: ComponentAction, ctx: RuntimeActionContext): void {
    const values = this.formState.getValues();
    const missing = findMissingRequiredFields(this.runtimeContext.layoutNodes(), values);
    if (missing.length) {
      const labels = missing.map((m) => m.label).slice(0, 4).join(', ');
      const more = missing.length > 4 ? ` (+${missing.length - 4} more)` : '';
      this.toast.error(`Fill required fields: ${labels}${more}`);
      return;
    }

    this.pageData.submit(ctx.pageId, values).subscribe({
      next: () => this.toast.success(action.successMessage?.trim() || 'Submitted successfully.'),
      error: (err) => this.toast.error(this.extractError(err)),
    });
  }

  private runSignup(action: ComponentAction, ctx: RuntimeActionContext): void {
    this.auth
      .appSignup({
        software_id: ctx.softwareId,
        page_id: ctx.pageId,
        values: this.formState.getValues(),
      })
      .subscribe({
        next: () => {
          this.toast.success(action.successMessage?.trim() || 'Account created successfully.');
          if (action.targetPageId) {
            this.navigate(action.targetPageId, ctx.softwareId);
          }
        },
        error: (err) => this.toast.error(this.extractError(err)),
      });
  }

  private runLogin(action: ComponentAction, ctx: RuntimeActionContext): void {
    const values = this.formState.getValues();
    const emailKey = action.emailFieldKey?.trim() || 'email';
    const passwordKey = action.passwordFieldKey?.trim() || 'password';

    const email = String(values[emailKey] ?? '').trim();
    const password = String(values[passwordKey] ?? '');

    if (!email || !password) {
      this.toast.error(
        `Enter ${emailKey} and ${passwordKey} — set those field keys on your inputs in Properties.`,
      );
      return;
    }

    this.auth.login({ email, password }).subscribe({
      next: () => {
        this.toast.success(action.successMessage?.trim() || 'Logged in successfully.');
        this.navigateAfterLogin(action, ctx);
      },
      error: (err) => this.toast.error(this.extractError(err)),
    });
  }

  private navigateAfterLogin(action: ComponentAction, ctx: RuntimeActionContext): void {
    const explicitTarget = this.resolveLoginTargetPageId(action);
    if (explicitTarget) {
      this.navigate(explicitTarget, ctx.softwareId);
      return;
    }

    this.pageService
      .list(ctx.softwareId)
      .pipe(map((pages) => resolvePostLoginPageId(pages, { excludePageId: ctx.pageId })))
      .subscribe({
        next: (resolved) => {
          if (resolved) {
            this.navigate(resolved, ctx.softwareId);
          }
        },
      });
  }

  private resolveLoginTargetPageId(action?: ComponentAction | null): string | undefined {
    const target = action?.targetPageId?.trim();
    if (!target) {
      return undefined;
    }
    const type = action?.actionType;
    if (!type || type === 'none') {
      return undefined;
    }
    return target;
  }

  private navigate(targetPageId: string | undefined, softwareId: string): void {
    if (!targetPageId) {
      return;
    }
    if (this.router.url.match(/^\/p\/([^/?#]+)/)) {
      void this.router.navigate(['/p', softwareId, targetPageId]);
      return;
    }
    void this.router.navigate(['/run', softwareId, targetPageId]);
  }

  private callApi(action: ComponentAction): void {
    const url = action.apiUrl?.trim();
    if (!url) {
      this.toast.error('This action has no endpoint URL configured.');
      return;
    }

    const method: ApiMethod = action.apiMethod ?? 'POST';
    const values = action.apiSendFormData ? this.formState.getValues() : {};

    const onSuccess = () => this.toast.success(action.successMessage?.trim() || 'Done.');
    const onError = (err: unknown) => this.toast.error(this.extractError(err));

    let request$;
    switch (method) {
      case 'GET':
        request$ = this.http.get(url, { params: this.toParams(values) });
        break;
      case 'DELETE':
        request$ = this.http.delete(url, { params: this.toParams(values) });
        break;
      case 'PUT':
        request$ = this.http.put(url, values);
        break;
      case 'PATCH':
        request$ = this.http.patch(url, values);
        break;
      case 'POST':
      default:
        request$ = this.http.post(url, values);
        break;
    }

    request$.subscribe({ next: onSuccess, error: onError });
  }

  private toParams(values: Record<string, unknown>): Record<string, string> {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value != null) {
        params[key] = String(value);
      }
    }
    return params;
  }

  private extractError(err: unknown): string {
    const detail = (err as { error?: { detail?: unknown } })?.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    return 'The request failed. Please check your inputs and try again.';
  }
}
