import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  PageCreate,
  PageLayoutRead,
  PageLayoutWrite,
  PageRead,
  PageUpdate,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiV1BaseUrl}/pages`;

  list(softwareId?: string): Observable<PageRead[]> {
    let params = new HttpParams();
    if (softwareId != null) {
      params = params.set('software_id', softwareId.toString());
    }
    return this.http.get<PageRead[]>(this.baseUrl, { params });
  }

  get(id: string): Observable<PageRead> {
    return this.http.get<PageRead>(`${this.baseUrl}/${id}`);
  }

  create(payload: PageCreate): Observable<PageRead> {
    return this.http.post<PageRead>(this.baseUrl, payload);
  }

  update(id: string, payload: PageUpdate): Observable<PageRead> {
    return this.http.put<PageRead>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  setDefault(id: string): Observable<PageRead> {
    return this.http.patch<PageRead>(`${this.baseUrl}/${id}/set-default`, {});
  }

  getLayout(id: string): Observable<PageLayoutRead> {
    return this.http.get<PageLayoutRead>(`${this.baseUrl}/${id}/layout`);
  }

  saveLayout(id: string, payload: PageLayoutWrite): Observable<PageLayoutRead> {
    return this.http.put<PageLayoutRead>(`${this.baseUrl}/${id}/layout`, payload);
  }
}
