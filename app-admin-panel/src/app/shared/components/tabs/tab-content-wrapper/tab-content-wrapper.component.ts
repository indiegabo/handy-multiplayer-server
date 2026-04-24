import { AfterContentInit, Component, ContentChildren, Input, QueryList } from '@angular/core';
import { TabContentComponent } from '../tab-content/tab-content.component';

@Component({
  selector: 'app-tab-content-wrapper',
  templateUrl: './tab-content-wrapper.component.html',
  styleUrl: './tab-content-wrapper.component.scss',
  standalone: false
})
export class TabContentWrapperComponent implements AfterContentInit {
  @Input()
  get selectedTabId(): string | undefined { return this._selectedTabId; }
  set selectedTabId(tabId: string | undefined) {
    this._selectedTabId = tabId;
    this.onSelectedTabIdChange(tabId);
  }
  @ContentChildren(TabContentComponent) contentComponents!: QueryList<TabContentComponent>;

  private _selectedTabId: string | undefined;

  componentsMap = new Map<string, TabContentComponent>();
  selectedContent?: TabContentComponent;

  constructor() { }

  ngAfterContentInit() {
    this.contentComponents.forEach(component => {
      component.wrapper = this;
      this.componentsMap.set(component.forTab, component);
    });
    this.selectTab(this.contentComponents.first);
  }

  onSelectedTabIdChange(tabId: string | undefined): void {
    if (!tabId || tabId === '') return;

    const content = this.componentsMap.get(tabId);
    this.selectTab(content);
  }

  private selectTab(content: TabContentComponent | undefined) {
    this.selectedContent?.dismiss();

    if (!content) return;

    this.selectedContent = content;
    this.selectedContent.activate();
  }
}
