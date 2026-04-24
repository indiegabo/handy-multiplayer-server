import { AfterContentChecked, AfterContentInit, Component, ContentChild, ContentChildren, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList } from '@angular/core';
import { HandyExpandablePanelHeaderComponent } from './handy-expandable-panel-header/handy-expandable-panel-header.component';
import { HandyExpandablePanelBodyComponent } from './handy-expandable-panel-body/handy-expandable-panel-body.component';
import { BehaviorSubject, Subscription } from 'rxjs';

export type PanelState = 'collapsed' | 'expanded';
@Component({
  selector: 'handy-expandable-panel',
  templateUrl: './handy-expandable-panel.component.html',
  styleUrl: './handy-expandable-panel.component.scss',
  standalone: false
})
export class HandyExpandablePanelComponent implements OnInit, AfterContentInit, OnDestroy {
  @Input() disabled = false;
  @Input() expandThroughToggle = true;
  @Input() hideToggle = false;
  @ContentChildren(HandyExpandablePanelHeaderComponent) headerComponents?: QueryList<HandyExpandablePanelHeaderComponent>;
  @ContentChildren(HandyExpandablePanelBodyComponent) bodyComponents?: QueryList<HandyExpandablePanelBodyComponent>;
  @Output() state$ = new BehaviorSubject<PanelState>('collapsed');

  headerComponent?: HandyExpandablePanelHeaderComponent;
  bodyComponent?: HandyExpandablePanelBodyComponent;

  subscriptions: Subscription[] = [];

  get state(): PanelState { return this.state$.getValue(); }

  constructor() { }

  ngOnInit(): void {

  }

  ngAfterContentInit(): void {
    // @ContentChild does not work for this case. We need to use @ContentChildren
    // so a query list is created.

    if (this.headerComponents && this.headerComponents.length > 0) {
      this.initializeHeaderComponent(this.headerComponents.first);
    }

    if (this.bodyComponents && this.bodyComponents.length > 0) {
      this.initializeBodyComponent(this.bodyComponents.first);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private initializeHeaderComponent(component: HandyExpandablePanelHeaderComponent) {
    this.headerComponent = component;
    this.headerComponent.init(this);
    const sub = component.toggleBodySignal$.subscribe(_ => {
      this.handleStateToggle();
    });
    this.subscriptions.push(sub);
  }

  private initializeBodyComponent(component: HandyExpandablePanelBodyComponent) {
    this.bodyComponent = component;
    this.bodyComponent.init(this);
  }

  private handleStateToggle() {
    const newState = this.state === 'collapsed' ? 'expanded' : 'collapsed';
    this.state$.next(newState);
  }
}
