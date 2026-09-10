import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  AppSignupRequest,
  AppSignupResponse,
  LoginRequest,
  MeResponse,
  OrganizationSummary,
  TokenResponse,
  UserRead,
} from '../models/auth.model';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly _user = signal<UserRead | null>(null);
  private readonly _organization = signal<OrganizationSummary | null>(null);

  readonly user = this._user.asReadonly();
  readonly organization = this._organization.asReadonly();
  readonly isAuthenticated = computed(
    () => this.tokenStorage.hasAccessToken() && this._user() !== null,
  );

  login(payload: LoginRequest): Observable<MeResponse> {
    return this.http
      .post<TokenResponse>(`${environment.apiV1BaseUrl}/auth/login`, payload)
      .pipe(switchMap((tokens) => this.establishSession(tokens)));
  }

  /** Sign up an app end-user from a builder page (maps field keys → account). */
  appSignup(payload: AppSignupRequest): Observable<AppSignupResponse> {
    return this.http
      .post<AppSignupResponse>(`${environment.apiV1BaseUrl}/auth/app-signup`, payload)
      .pipe(
        switchMap((response) =>
          this.establishSession(response.tokens).pipe(map(() => response)),
        ),
      );
  }

  /** Store JWT tokens and load the current user — used by login & runtime signup. */
  establishSession(tokens: TokenResponse): Observable<MeResponse> {
    this.tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    return this.loadMe();
  }

  completeOAuthLogin(accessToken: string, refreshToken: string): Observable<MeResponse> {
    return this.establishSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'bearer',
    });
  }

  startGoogleLogin(options: {
    softwareId: string;
    pageId: string;
    targetPageId?: string;
  }): void {
    const returnUrl = `${window.location.origin}/oauth/callback`;
    const params = new URLSearchParams({
      software_id: options.softwareId,
      page_id: options.pageId,
      return_url: returnUrl,
    });
    if (options.targetPageId) {
      params.set('target_page_id', options.targetPageId);
    }
    window.location.href = `${environment.apiV1BaseUrl}/auth/oauth/google/start?${params.toString()}`;
  }

  loadMe(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${environment.apiV1BaseUrl}/auth/me`).pipe(
      tap((response) => {
        this._user.set(response.user);
        this._organization.set(response.organization);
      }),
    );
  }

  logout(): Observable<void> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return new Observable<void>((subscriber) => {
        subscriber.next();
        subscriber.complete();
      });
    }

    return this.http
      .post<void>(`${environment.apiV1BaseUrl}/auth/logout`, { refresh_token: refreshToken })
      .pipe(tap({ next: () => this.clearSession(), error: () => this.clearSession() }));
  }

  clearSession(): void {
    this.tokenStorage.clear();
    this._user.set(null);
    this._organization.set(null);
  }

  handleUnauthorized(): void {
    this.clearSession();
    const url = this.router.url;
    if (url.startsWith('/p/') || url.startsWith('/run/')) {
      return;
    }
    void this.router.navigate(['/login']);
  }
}
