import { Component, OnDestroy, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from
  '@angular/animations';
import { fadeIn } from 'src/app/shared/animations/fade.animation';
import { NavigationSection } from
  'src/app/shared/components/navigation/navigation-item';
import { Subscription } from 'rxjs';
import { NavigationRegistryService } from 'src/app/shared/navigation/navigation-registry.service';

const STORAGE_KEY = 'sidebar-state';

@Component({
  selector: 'app-sidebar',
  templateUrl: './app-sidebar.component.html',
  styleUrls: ['./app-sidebar.component.scss'],
  standalone: false,
  animations: [
    trigger('grow', [
      state('collapsed', style({ width: '60px' })),
      state('expanded', style({ width: '250px' })),
      transition('expanded <=> collapsed', [animate('200ms ease-in')]),
      transition('collapsed <=> expanded', [animate('200ms ease-out')])
    ]),
    fadeIn
  ]
})
export class AppSidebarComponent implements OnInit, OnDestroy {
  sections: NavigationSection[] = [];
  expansionState: 'collapsed' | 'expanded' = 'collapsed';

  private sub?: Subscription;

  constructor(
    private readonly registry: NavigationRegistryService,
  ) { }

  ngOnInit(): void {
    let existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) existing = 'expanded';
    this.expansionState = existing as 'collapsed' | 'expanded';

    // Subscribe to dynamic updates (lazy modules registering sections)
    this.sub = this.registry.sections$.subscribe(sections => {
      this.sections = sections;
    });

    this.registerExpansionState();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleExpansion(): void {
    this.expansionState =
      this.expansionState === 'collapsed' ? 'expanded' : 'collapsed';
    this.registerExpansionState();
  }

  private registerExpansionState(): void {
    localStorage.setItem(STORAGE_KEY, this.expansionState);
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
