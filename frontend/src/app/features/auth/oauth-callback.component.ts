import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, of, switchMap } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { PageService } from '../../core/services/page.service';
import { RuntimeToastService } from '../../core/services/runtime-toast.service';
import { resolvePostLoginPageId } from '../../core/utils/post-login-page.util';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="oauth-callback">
      <p>Signing you in…</p>
    </div>
  `,
  styles: `
    .oauth-callback {
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: system-ui, sans-serif;
      color: #475569;
    }
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly pageService = inject(PageService);
  private readonly toast = inject(RuntimeToastService);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const softwareId = params.get('software_id');
    const loginPageId = params.get('page_id');
    const targetPageId = params.get('target_page_id');

    if (!accessToken || !refreshToken) {
      this.toast.error('Google sign-in failed or was cancelled.');
      void this.router.navigate(['/']);
      return;
    }

    this.auth
      .completeOAuthLogin(accessToken, refreshToken)
      .pipe(
        switchMap(() => {
          if (!softwareId) {
            return of(['/dashboard'] as const);
          }
          if (targetPageId) {
            return of(['/p', softwareId, targetPageId] as const);
          }
          return this.pageService.list(softwareId).pipe(
            map((pages) => {
              const resolved = resolvePostLoginPageId(pages, {
                excludePageId: loginPageId ?? undefined,
              });
              return resolved
                ? (['/p', softwareId, resolved] as const)
                : (['/p', softwareId] as const);
            }),
          );
        }),
      )
      .subscribe({
        next: (commands) => {
          this.toast.success('Signed in with Google.');
          void this.router.navigate([...commands]);
        },
        error: () => {
          this.toast.error('Could not finish Google sign-in.');
          void this.router.navigate(['/']);
        },
      });
  }
}
