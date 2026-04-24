import {
  AfterContentInit,
  Component,
  ContentChildren,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {
  CdkDropList,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { TabComponent } from '../tab/tab.component';

@Component({
  selector: 'app-tab-group',
  templateUrl: './tab-group.component.html',
  styleUrl: './tab-group.component.scss',
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [CdkDropList],
  host: {
    class: 'app-tab-group full-width layout-row',
  },
  standalone: false
})
export class TabGroupComponent implements AfterContentInit, OnChanges, OnDestroy {
  private readonly cdkDropList = inject<CdkDropList<string[]>>(CdkDropList);

  @Input() firstTab?: string;
  @Input() reorderable = false;
  @ContentChildren(TabComponent, { descendants: false })
  tabComponents!: QueryList<TabComponent>;
  @Output() selectedTabIdChanged$ = new EventEmitter<string>();
  @Output() tabsReordered$ = new EventEmitter<string[]>();


  selectedTab?: TabComponent;
  tabsMap = new Map<string, TabComponent>();
  tabOrder: string[] = [];
  private tabsChangesSub?: Subscription;
  private dropEventsSub?: Subscription;
  private selectionSyncTimeout?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reorderable']) {
      this.syncDragMode();
      this.syncDropListConfig();
    }
  }

  ngAfterContentInit(): void {
    this.syncDropListConfig();
    this.refreshTabs();

    this.dropEventsSub = this.cdkDropList.dropped.subscribe((event) => {
      this.onTabsDrop(event);
    });

    this.tabsChangesSub = this.tabComponents.changes.subscribe(() => {
      this.refreshTabs();
      this.scheduleSelectionSync();
    });

    this.scheduleSelectionSync();
  }

  ngOnDestroy(): void {
    if (this.selectionSyncTimeout) {
      clearTimeout(this.selectionSyncTimeout);
    }

    this.tabsChangesSub?.unsubscribe();
    this.dropEventsSub?.unsubscribe();
  }

  private refreshTabs(): void {
    if (!this.tabComponents) {
      return;
    }

    const previouslySelectedId = this.selectedTab?.id;
    const incomingTabIds = this.tabComponents.map((tab) => tab.id);

    this.tabOrder = this.reconcileTabOrder(incomingTabIds);
    this.syncDropListConfig();

    this.tabsMap.clear();
    this.tabComponents.forEach((tab) => {
      tab.tabGroup = this;
      tab.configureDrag(this.reorderable);
      this.tabsMap.set(tab.id, tab);
    });

    if (previouslySelectedId && this.tabsMap.has(previouslySelectedId)) {
      this.selectedTab = this.tabsMap.get(previouslySelectedId);
      return;
    }

    this.selectedTab = undefined;
  }

  onTabsDrop(event: CdkDragDrop<string[]>): void {
    if (
      !this.reorderable
      || event.previousIndex === event.currentIndex
      || event.previousIndex < 0
      || event.currentIndex < 0
      || event.previousIndex >= this.tabOrder.length
      || event.currentIndex >= this.tabOrder.length
    ) {
      return;
    }

    moveItemInArray(this.tabOrder, event.previousIndex, event.currentIndex);
    this.tabsReordered$.emit([...this.tabOrder]);
  }

  selectTabUsingId(tabId: string, silent = false): void {
    if (!this.tabsMap.has(tabId)) return;
    const tab = this.tabsMap.get(tabId);
    this.selectTab(tab!, silent);
  }

  selectTab(tab: TabComponent, silent = false): void {
    if (this.selectedTab?.id === tab.id) {
      if (!this.selectedTab.active) {
        this.selectedTab.activate();
      }

      if (!silent) {
        this.selectedTabIdChanged$.emit(this.selectedTab.id);
      }

      return;
    }

    this.selectedTab?.dismiss();
    this.selectedTab = tab;
    this.selectedTab.activate();
    if (!silent)
      this.selectedTabIdChanged$.emit(this.selectedTab.id);
  }

  private scheduleSelectionSync(): void {
    if (this.selectionSyncTimeout) {
      clearTimeout(this.selectionSyncTimeout);
    }

    this.selectionSyncTimeout = setTimeout(() => {
      this.selectionSyncTimeout = undefined;
      this.ensureSelection();
    }, 0);
  }

  private ensureSelection(): void {
    if (!this.tabComponents || this.tabComponents.length === 0) {
      this.selectedTab = undefined;
      return;
    }

    if (this.selectedTab && this.tabsMap.has(this.selectedTab.id)) {
      this.selectTabUsingId(this.selectedTab.id, true);
      return;
    }

    if (this.firstTab && this.tabsMap.has(this.firstTab)) {
      this.selectTabUsingId(this.firstTab, true);
      return;
    }

    this.selectTab(this.tabComponents.first, true);
  }

  private syncDragMode(): void {
    if (!this.tabComponents) {
      return;
    }

    this.tabComponents.forEach((tab) => {
      tab.configureDrag(this.reorderable);
    });
  }

  private syncDropListConfig(): void {
    this.cdkDropList.orientation = 'horizontal';
    this.cdkDropList.lockAxis = 'x';
    this.cdkDropList.disabled = !this.reorderable;
    this.cdkDropList.data = this.tabOrder;
  }

  private reconcileTabOrder(incomingTabIds: string[]): string[] {
    if (this.tabOrder.length === 0) {
      return [...incomingTabIds];
    }

    const preservedIds = this.tabOrder.filter(
      (tabId) => incomingTabIds.includes(tabId),
    );
    const newIds = incomingTabIds.filter(
      (tabId) => !preservedIds.includes(tabId),
    );

    return [...preservedIds, ...newIds];
  }
}
