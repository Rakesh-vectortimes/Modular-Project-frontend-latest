import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { PublishedLayoutRead } from '@app-builder/core/models/page-component-node.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PublishedLayoutService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiV1BaseUrl}/software`;

  getLayout(softwareId: string): Observable<PublishedLayoutRead> {
    return this.http.get<PublishedLayoutRead>(`${this.baseUrl}/${softwareId}/published`);
  }
}
