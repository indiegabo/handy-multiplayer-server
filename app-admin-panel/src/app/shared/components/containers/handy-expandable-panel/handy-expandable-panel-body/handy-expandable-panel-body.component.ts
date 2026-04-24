import { Component, OnDestroy, OnInit } from '@angular/core';
import { expandCollapse } from '../handy-expandable-panel.animation';
import { HandyExpandablePanelComponent, PanelState } from '../handy-expandable-panel.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'handy-expandable-panel-body',
  templateUrl: './handy-expandable-panel-body.component.html',
  styleUrl: './handy-expandable-panel-body.component.scss',
  animations: [expandCollapse],
  standalone: false
})
export class HandyExpandablePanelBodyComponent implements OnInit, OnDestroy {

  panel?: HandyExpandablePanelComponent;
  state: PanelState = 'collapsed';

  subscriptions: Subscription[] = [];

  constructor() { }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  init(panel: HandyExpandablePanelComponent): void {
    this.panel = panel;
    this.state = panel.state;

    const sub = this.panel.state$.subscribe(state => {
      this.state = state;
    });
    this.subscriptions.push(sub);
  }

}
