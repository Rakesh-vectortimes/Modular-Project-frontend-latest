import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { UserRead } from '../models/auth.model';
import { UserCreate, UserListParams, UserListResponse, UserUpdate } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiV1BaseUrl}/users`;

  list(params: UserListParams = {}): Observable<UserListResponse> {
    let httpParams = new HttpParams();
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.role) {
      httpParams = httpParams.set('role', params.role);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.page != null) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.page_size != null) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }
    return this.http.get<UserListResponse>(this.baseUrl, { params: httpParams });
  }

  get(id: string): Observable<UserRead> {
    return this.http.get<UserRead>(`${this.baseUrl}/${id}`);
  }

  create(payload: UserCreate): Observable<UserRead> {
    return this.http.post<UserRead>(this.baseUrl, payload);
  }

  update(id: string, payload: UserUpdate): Observable<UserRead> {
    return this.http.patch<UserRead>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
