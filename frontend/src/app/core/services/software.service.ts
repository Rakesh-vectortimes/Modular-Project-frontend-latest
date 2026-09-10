import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SoftwareCreate, SoftwareRead, SoftwareUpdate, PublishedLayoutRead } from '../models';

@Injectable({ providedIn: 'root' })
export class SoftwareService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiV1BaseUrl}/software`;

  list(skip = 0, limit = 100): Observable<SoftwareRead[]> {
    const params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());

    return this.http.get<SoftwareRead[]>(this.baseUrl, { params });
  }

  get(id: string): Observable<SoftwareRead> {
    return this.http.get<SoftwareRead>(`${this.baseUrl}/${id}`);
  }

  create(payload: SoftwareCreate): Observable<SoftwareRead> {
    return this.http.post<SoftwareRead>(this.baseUrl, payload);
  }

  update(id: string, payload: SoftwareUpdate): Observable<SoftwareRead> {
    return this.http.put<SoftwareRead>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPublishedLayout(softwareId: string, pageId?: string): Observable<PublishedLayoutRead> {
    let params = new HttpParams();
    if (pageId) {
      params = params.set('page_id', pageId);
    }
    return this.http.get<PublishedLayoutRead>(`${this.baseUrl}/${softwareId}/published`, {
      params,
    });
  }
}
