import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ClientItem, PagedResult } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class Clients {
  private http = inject(HttpClient);

  getAll(pageNumber = 1, pageSize = 50) {
    const params = new HttpParams().set('PageNumber', pageNumber).set('PageSize', pageSize);
    return this.http.get<PagedResult<ClientItem>>(`${environment.mainApiUrl}/Clients/Clients`, { params });
  }
}