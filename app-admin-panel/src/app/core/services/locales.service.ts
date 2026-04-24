import { HttpService } from './http.service';
import { Observable, from, map, tap } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { DataResponse } from 'src/app/shared/models/http/http-responses';
import { RequestAuthentication, RequestMeta } from 'src/app/shared/models/http/http-request';

@Injectable({
  providedIn: 'root'
})
export class LocalesService {

  private _suggestions?: string[];

  constructor(private httpService: HttpService) {
  }

  public getSuggestions(): Observable<string[]> {
    const meta: RequestMeta = {
      authentication: RequestAuthentication.Authenticated,
    };

    if (this._suggestions && this._suggestions.length > 0) {
      return from([this._suggestions]);
    }

    return this.httpService.get<string[]>(`${environment.apiEndpoint}/locales/suggestions`, meta).pipe(
      tap(res => {
        this._suggestions = res.data;
      }),
      map(res => res.data)
    );
  }
}
