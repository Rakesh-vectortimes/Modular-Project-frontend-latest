import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

export interface ImageUploadResult {
  url: string;
  filename: string;
  content_type: string;
  size: number;
}

/** Abort hung upload requests so the Properties panel never stays on "Uploading…". */
const UPLOAD_TIMEOUT_MS = 20_000;

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiV1BaseUrl}/uploads`;

  uploadImage(file: File): Observable<string> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<ImageUploadResult>(`${this.baseUrl}/images`, form).pipe(
      timeout(UPLOAD_TIMEOUT_MS),
      map((res) => this.toAbsoluteUrl(res.url)),
      catchError((err) => {
        if (err instanceof TimeoutError || err?.name === 'TimeoutError') {
          return throwError(
            () => new Error('Upload timed out. Is the API at localhost:8000 running?'),
          );
        }
        const detail =
          typeof err?.error?.detail === 'string'
            ? err.error.detail
            : err?.message || 'Upload failed. Check that the backend is running.';
        return throwError(() => new Error(detail));
      }),
    );
  }

  /** Turn API-relative /uploads/... into an absolute backend URL for canvas + publish. */
  toAbsoluteUrl(url: string): string {
    const trimmed = url.trim();
    if (!trimmed) {
      return '';
    }
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return `${environment.apiBaseUrl}${trimmed}`;
    }
    return trimmed;
  }
}
