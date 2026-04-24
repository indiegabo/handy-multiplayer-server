import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { Component, OnInit, Input, HostBinding, ViewEncapsulation, OnDestroy } from '@angular/core';
import { fadeIn, fadeInDefaultParams } from 'src/app/shared/animations/fade.animation';
import { NavigationItem } from '../navigation-item';
import { NavigationService } from 'src/app/core/services/navigation.service';
import { Subscription } from 'rxjs';

const STORAGE_PREFIX = 'navigation-';

@Component({
  selector: 'app-navigation-item',
  templateUrl: './navigation-item.component.html',
  styleUrls: ['./navigation-item.component.scss'],
  standalone: false,
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(90deg)' })),
      state('expanded', style({ transform: 'rotate(0deg)' })),
      transition('expanded <=> collapsed',
        animate('100ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
    trigger('grow', [
      state('collapsed', style({ height: '0px' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', [
        animate('100ms ease-in'),
      ]),
      transition('collapsed <=> expanded', [
        animate('100ms ease-out'),
      ])
    ]),
    fadeIn
  ]
})
export class NavigationItemComponent implements OnInit, OnDestroy {

  public expanded = true;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item!: NavigationItem;
  @Input() textColor!: string;
  @Input() depth!: number;
  @Input() isChild = false;

  fadeInParams = fadeInDefaultParams;
  expansionState = 'collapsed';

  private subscriptions: Subscription[] = [];

  constructor(
    public navigationService: NavigationService,
    public router: Router
  ) {
    if (this.depth === undefined) {
      this.depth = 1;
    }
  }

  ngOnInit(): void {
    const sub = this.navigationService.currentUrl.subscribe((url: string) => {
      if (!url) return;
      // console.log(`Checking '${this.item.route}' against '${url}'`);

      this.item.active = url.indexOf(`${this.item.route}`) === 0;
      this.ariaExpanded = this.expanded;

      if (!this.item.children || (this.item.children && !this.item.children.length)) return;

      let currentExpansionState = localStorage.getItem(`${STORAGE_PREFIX}${this.item.id}`);
      if (!currentExpansionState) {
        currentExpansionState = 'collapsed';
      }

      if (currentExpansionState === 'collapsed') {
        const isCurrentRoute = url.includes(`${this.item.route}`);
        this.expanded = isCurrentRoute;
      }

      this.registerExpansionState();
      // console.log(`/${this.item.route} is expanded: ${this.expanded}`);
    });

    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  public onItemSelected(item: NavigationItem): void {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route]);
      return;
    }

    this.expandItem(item);
  }

  public expandItem(item: NavigationItem): void {
    this.expanded = !this.expanded;
    this.registerExpansionState();
  }

  private registerExpansionState(): void {
    if (!this.item.children || !this.item.children.length) return;

    if (this.expanded) {
      this.expansionState = 'expanded';
    } else {
      this.expansionState = 'collapsed';
    }

    localStorage.setItem(`${STORAGE_PREFIX}${this.item.id}`, this.expansionState);
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
