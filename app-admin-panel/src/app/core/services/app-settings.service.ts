import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "src/environments/environment";

export type HttpTarget = 'localhost' | 'production';

@Injectable({
  providedIn: 'root'
})
export class AppSettingsService {

  private _httpTarget$ = new BehaviorSubject<HttpTarget>('localhost');
  private _baseUrl!: string;
  private _systemBaseUrl!: string;

  get baseUrl(): string {
    return this._baseUrl;
  }

  get systemBaseUrl(): string {
    return this._systemBaseUrl;
  }

  constructor(
  ) {
  }

  init() {
    if (environment.production) {
      this._baseUrl = '/system/v1';
    }
    else {
      this._baseUrl = `http://localhost:81/v1`;
    }
    const currentHttpTarget = localStorage.getItem('httpTarget');
    if (currentHttpTarget && (currentHttpTarget === 'localhost' || currentHttpTarget === 'production')) {
      this._httpTarget$.next(currentHttpTarget as HttpTarget);
    } else {
      this._httpTarget$.next('localhost');
    }

    this.defineUrls(this.httpTarget);
  }

  get httpTarget$(): Observable<HttpTarget> {
    return this._httpTarget$.asObservable();
  }

  get httpTarget(): HttpTarget {
    return this._httpTarget$.value;
  }

  set httpTarget(httpTarget: HttpTarget) {
    localStorage.setItem('httpTarget', httpTarget);
    this._httpTarget$.next(httpTarget);
    this.defineUrls(httpTarget);
  }

  private defineUrls(httpTarget: HttpTarget) {
    if (httpTarget === 'localhost') {
      this._baseUrl = `http://localhost/v1`;
      this._systemBaseUrl = `http://localhost:81/v1`;
    } else if (httpTarget === 'production') {
      this._baseUrl = `https://api.poxablaus.com/v1`;
      this._systemBaseUrl = `https://api.poxablaus.com:81/v1`;
    }
  }
}
