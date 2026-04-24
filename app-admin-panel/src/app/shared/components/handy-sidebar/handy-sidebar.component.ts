import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { fadeIn } from '@electron-renderer/app/shared/animations/fade.animation';
import { animate, query, state, style, transition, trigger } from '@angular/animations';
import { NavigationItem } from '../navigation/navigation-item';

const DEFAULT_STORAGE_KEY = 'sidebar-state';

@Component({
  selector: 'handy-sidebar',
  templateUrl: './handy-sidebar.component.html',
  styleUrls: ['./handy-sidebar.component.scss'],
  animations: [
    trigger('grow', [
      state('collapsed', style({ width: '60px' })),
      state('expanded', style({ width: '250px' })),
      transition('expanded <=> collapsed', [
        animate('100ms ease-in'),
      ]),
      transition('collapsed <=> expanded', [
        animate('100ms ease-out'),
      ])
    ]),
    fadeIn
  ],
  standalone: false
})
export class HandySidebarComponent implements OnInit, OnDestroy {
  @Input() navItems: NavigationItem[] = [];
  @Input() storageKey = DEFAULT_STORAGE_KEY;
  expansionState = 'collapsed';

  constructor(
  ) {
  }

  ngOnInit() {
    let existingState = localStorage.getItem(this.storageKey);
    if (!existingState) {
      existingState = 'expanded';
    }

    this.expansionState = existingState;
    this.registerExpansionState();
  }

  ngOnDestroy() {
  }

  toggleExpansion() {
    if (this.expansionState === 'collapsed') {
      this.expansionState = 'expanded';
    } else {
      this.expansionState = 'collapsed';
    }

    this.registerExpansionState();
  }

  private registerExpansionState(): void {
    localStorage.setItem(this.storageKey, this.expansionState);
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
