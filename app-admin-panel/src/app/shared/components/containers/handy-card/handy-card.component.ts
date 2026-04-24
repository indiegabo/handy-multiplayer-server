import { Component, ContentChildren, Input, QueryList, OnInit, AfterContentInit, OnDestroy } from '@angular/core';
import { HandyCardHeaderComponent } from './handy-card-header/handy-card-header.component';
import { HandyCardBodyComponent } from './handy-card-body/handy-card-body.component';

@Component({
    selector: 'handy-card',
    templateUrl: './handy-card.component.html',
    styleUrl: './handy-card.component.scss',
    standalone: false
})
export class HandyCardComponent implements OnInit, AfterContentInit, OnDestroy {
  @Input() expandHorizontally = false;
  @ContentChildren(HandyCardHeaderComponent) headerComponents?: QueryList<HandyCardHeaderComponent>;
  @ContentChildren(HandyCardBodyComponent) bodyComponents?: QueryList<HandyCardBodyComponent>;

  headerComponent?: HandyCardHeaderComponent;
  bodyComponent?: HandyCardBodyComponent;

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
  }

  /**
   * Initializes the header component by assigning the provided
   * HandyCardHeaderComponent instance to the `headerComponent` property
   * and invoking its `init` method with the current HandyCardComponent
   * instance as a parameter.
   *
   * @param component - The HandyCardHeaderComponent instance to initialize.
   */
  private initializeHeaderComponent(component: HandyCardHeaderComponent) {
    this.headerComponent = component;
    this.headerComponent.init(this);
  }

  /**
   * Initializes the body component by assigning the provided
   * HandyCardBodyComponent instance to the `bodyComponent` property
   * and invoking its `init` method with the current HandyCardComponent
   * instance as a parameter.
   *
   * @param component - The HandyCardBodyComponent instance to initialize.
   */
  private initializeBodyComponent(component: HandyCardBodyComponent) {
    this.bodyComponent = component;
    this.bodyComponent.init(this);
  }
}
