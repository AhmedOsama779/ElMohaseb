import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, LookupItem } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class Lookup {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getCountries(): Observable<LookupItem[]> {
    return this.http
      .get<ApiResponse<LookupItem[]>>(`${this.base}/Countries`)
      .pipe(map(res => res.data));
  }

  getCities(countryId: number): Observable<LookupItem[]> {
    return this.http
      .get<ApiResponse<LookupItem[]>>(`${this.base}/Cities/${countryId}`)
      .pipe(map(res => res.data));
  }
}