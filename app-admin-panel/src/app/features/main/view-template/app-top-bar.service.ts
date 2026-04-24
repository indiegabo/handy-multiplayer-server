import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class AppTopBarService {

  titleChanged$ = new BehaviorSubject<string | undefined>('');

  get title(): string | undefined {
    return this._title;
  }

  private _title?: string;

  constructor() { }


  setTitle(title: string) {
    this._title = title;
    this.titleChanged$.next(this._title);
  }

  dismissTitle() {
    delete this._title;
    this.titleChanged$.next(this._title);
  }
}
