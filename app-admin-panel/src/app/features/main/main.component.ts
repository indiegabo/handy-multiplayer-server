import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None
})
export class MainComponent implements OnInit, OnDestroy, AfterViewInit {

  currentScreenSize!: string;
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

  ngOnInit(): void {
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  ngAfterViewInit(): void {

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
          this.currentScreenSize = this.screenSizeNameMap.get(query) ?? 'Unknown';
          this.handleSizing(this.currentScreenSize);
        }
      }
    });

  }

  private handleSizing(currentScreenSize: string): void {
    if (currentScreenSize === 'XSmall' || currentScreenSize === 'Small') {
      // this.drawerMode = 'over';
    } else {
      // this.drawerMode = 'side';
    }
  }

}
