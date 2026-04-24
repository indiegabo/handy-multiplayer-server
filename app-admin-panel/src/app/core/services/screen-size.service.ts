import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export enum ScreenSize {
  XSmall = 'XSmall',
  Small = 'Small',
  Medium = 'Medium',
  Large = 'Large',
  XLarge = 'XLarge'
}

@Injectable({
  providedIn: 'root'
})
export class ScreenSizeService implements OnDestroy {

  private _currentScreenSize?: string;
  public resized$ = new EventEmitter<string | undefined>();
  destroyed = new Subject<void>();
  screenSizeNameMap = new Map([
    [Breakpoints.XSmall, 'XSmall'],
    [Breakpoints.Small, 'Small'],
    [Breakpoints.Medium, 'Medium'],
    [Breakpoints.Large, 'Large'],
    [Breakpoints.XLarge, 'XLarge'],
  ]);

  constructor(
    private breakpointObserver: BreakpointObserver,
  ) {
    this.observeBreakpoints();
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  public observeBreakpoints(): void {
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small,
      Breakpoints.Medium,
      Breakpoints.Large,
      Breakpoints.XLarge,
    ]).pipe(takeUntil(this.destroyed)).subscribe((result: any) => {
      for (const query of Object.keys(result.breakpoints)) {
        if (result.breakpoints[query]) {
          this.currentScreenSize = this.screenSizeNameMap.get(query) ?? undefined;
        }
      }
    });
  }

  public set currentScreenSize(v: string | undefined) {
    this._currentScreenSize = v;
    this.resized$.emit(this.currentScreenSize);
  }

  public get currentScreenSize(): string | undefined {
    return this._currentScreenSize;
  }


}
