import { IsActiveMatchOptions, Router } from '@angular/router';
import { Component, OnInit, Input, HostBinding, ViewEncapsulation } from '@angular/core';
import { NavigationItem } from '../navigation-item';
import { NavigationService } from 'src/app/core/services/navigation.service';

@Component({
  selector: 'app-navigation-item-short',
  templateUrl: './navigation-item-short.component.html',
  styleUrls: ['./navigation-item-short.component.scss'],
  standalone: false,
  animations: [],
})
export class NavigationItemShortComponent implements OnInit {

  public expanded = true;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item!: NavigationItem;
  @Input() textColor!: string;
  @Input() depth!: number;
  @Input() isChild = false;

  public activeMatchOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  };

  constructor(
    public navigationService: NavigationService,
    public router: Router
  ) {
    if (this.depth === undefined) {
      this.depth = 1;
    }
  }

  ngOnInit(): void {
    this.navigationService.currentUrl.subscribe((url: string) => {
      if (this.item.route && url) {
        // console.log(`Checking '${this.item.route}' against '${url}'`);
        this.expanded = url.includes(`${this.item.route}`);
        this.item.active = url.indexOf(`${this.item.route}`) === 0;
        this.ariaExpanded = this.expanded;
        // console.log(`/${this.item.route} is expanded: ${this.expanded}`);
      }
    });
  }

  public onItemSelected(item: NavigationItem): void {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route]);
    }

    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
    }
  }

  public expandItem(item: NavigationItem): void {
    if (item.children && item.children.length) {
      this.expanded = !this.expanded;
    }
  }

  public isRouteActive(item: NavigationItem): boolean {
    if (!item.route) {
      return false;
    }

    // Ensure absolute path for parseUrl
    const path: string = item.route.startsWith('/') ? item.route : `/${item.route}`;
    const tree = this.router.parseUrl(path);

    return this.router.isActive(tree, this.activeMatchOptions);
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
