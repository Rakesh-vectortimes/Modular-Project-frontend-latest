import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ComponentDefinitionGrouped } from '../models';

@Injectable({ providedIn: 'root' })
export class ComponentDefinitionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiV1BaseUrl}/component-definitions`;

  listGrouped(): Observable<ComponentDefinitionGrouped[]> {
    return this.http.get<ComponentDefinitionGrouped[]>(this.baseUrl);
  }
}
