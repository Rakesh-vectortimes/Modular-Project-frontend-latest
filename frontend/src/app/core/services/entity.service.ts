import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  EntityListRead,
  EntityRead,
  EntityRecordListRead,
} from '../models/entity.model';

/** Talks to the reusable entities (tables) shared across an app's pages. */
@Injectable({ providedIn: 'root' })
export class EntityService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiV1BaseUrl}/entities`;

  list(softwareId: string): Observable<EntityListRead> {
    const params = new HttpParams().set('software_id', softwareId);
    return this.http.get<EntityListRead>(this.baseUrl, { params });
  }

  get(entityId: string): Observable<EntityRead> {
    return this.http.get<EntityRead>(`${this.baseUrl}/${entityId}`);
  }

  listRecords(entityId: string, skip = 0, limit = 50): Observable<EntityRecordListRead> {
    return this.http.get<EntityRecordListRead>(`${this.baseUrl}/${entityId}/records`, {
      params: { skip: String(skip), limit: String(limit) },
    });
  }
}
