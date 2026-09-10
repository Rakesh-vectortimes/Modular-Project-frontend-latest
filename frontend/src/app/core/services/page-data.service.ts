import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface PageDataFieldSpec {
  key: string;
  label: string;
  component_type: string;
  data_type: string;
  required: boolean;
  unique: boolean;
}

export interface PageDataSchemaRead {
  page_id: string;
  collection_name: string | null;
  fields: PageDataFieldSpec[];
  entity_id?: string | null;
  entity_name?: string | null;
  updated_at: string | null;
}

export interface SubmissionRead {
  id: string;
  page_id: string;
  values: Record<string, unknown>;
  submitted_at: string;
  submitted_by: string | null;
}

export interface SubmissionListRead {
  total: number;
  items: SubmissionRead[];
}

/** Talks to the auto-created per-page data collections (design doc §6). */
@Injectable({ providedIn: 'root' })
export class PageDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiV1BaseUrl}/pages`;

  getSchema(pageId: string): Observable<PageDataSchemaRead> {
    return this.http.get<PageDataSchemaRead>(`${this.baseUrl}/${pageId}/data-schema`);
  }

  submit(pageId: string, values: Record<string, unknown>): Observable<SubmissionRead> {
    return this.http.post<SubmissionRead>(`${this.baseUrl}/${pageId}/submissions`, { values });
  }

  listSubmissions(pageId: string, skip = 0, limit = 50): Observable<SubmissionListRead> {
    return this.http.get<SubmissionListRead>(`${this.baseUrl}/${pageId}/submissions`, {
      params: { skip: String(skip), limit: String(limit) },
    });
  }
}
