import { Injectable, signal } from '@angular/core';

const REFRESH_TOKEN_KEY = 'app_builder_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  /** Access token kept in memory only. */
  private accessToken: string | null = null;

  private readonly _hasRefreshToken = signal(this.readRefreshToken() !== null);
  readonly hasRefreshToken = this._hasRefreshToken.asReadonly();

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    this._hasRefreshToken.set(true);
  }

  getRefreshToken(): string | null {
    return this.readRefreshToken();
  }

  clear(): void {
    this.accessToken = null;
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    this._hasRefreshToken.set(false);
  }

  hasAccessToken(): boolean {
    return this.accessToken !== null;
  }

  private readRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }
}
