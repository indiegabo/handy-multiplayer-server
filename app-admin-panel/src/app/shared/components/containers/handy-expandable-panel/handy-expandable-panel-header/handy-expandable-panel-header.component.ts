import { state } from '@angular/animations';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { rotate } from '../handy-expandable-panel.animation';
import { HandyExpandablePanelComponent, PanelState } from '../handy-expandable-panel.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'handy-expandable-panel-header',
  templateUrl: './handy-expandable-panel-header.component.html',
  styleUrl: './handy-expandable-panel-header.component.scss',
  animations: [rotate],
  standalone: false
})
export class HandyExpandablePanelHeaderComponent implements OnDestroy {
  @Output() toggleBodySignal$ = new EventEmitter();

  panel?: HandyExpandablePanelComponent;
  state: PanelState = 'collapsed';

  subscriptions: Subscription[] = [];

  constructor() { }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  init(panel: HandyExpandablePanelComponent): void {
    this.panel = panel;
    const sub = this.panel.state$.subscribe(state => {
      this.state = state;
    });
    this.subscriptions.push(sub);
  }


  evaluateContainerClick() {
    if (this.panel?.expandThroughToggle || this.panel?.disabled) return;
    this.toggleBodySignal$.emit();
  }

  evaluateToggleClick() {
    if (!this.panel?.expandThroughToggle || this.panel?.disabled) return;
    this.toggleBodySignal$.emit();
  }
}
