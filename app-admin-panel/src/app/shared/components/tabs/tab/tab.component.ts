import {
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { TabGroupComponent } from '../tab-group/tab-group.component';
import { FaIcon } from 'src/app/shared/models/icon';

@Component({
  selector: 'app-tab',
  templateUrl: './tab.component.html',
  styleUrl: './tab.component.scss',
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [CdkDrag],
  standalone: false
})
export class TabComponent implements OnChanges {
  private readonly cdkDrag = inject<CdkDrag<string>>(CdkDrag);

  @Input({ alias: 'tabId', required: true }) id!: string;
  @Input({ alias: 'label', required: true }) label!: string;
  @Input('icon') icon?: FaIcon;

  tabGroup?: TabGroupComponent;
  active = false;
  dragData = '';
  dragDisabled = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['id']) {
      this.dragData = this.id;
      this.cdkDrag.data = this.id;
      this.cdkDrag.lockAxis = 'x';
    }
  }

  configureDrag(enabled: boolean): void {
    this.dragDisabled = !enabled;
    this.dragData = this.id;
    this.cdkDrag.disabled = this.dragDisabled;
    this.cdkDrag.data = this.dragData;
    this.cdkDrag.lockAxis = 'x';
  }

  activate(): void {
    this.active = true;
  }

  dismiss(): void {
    this.active = false;
  }

  onClick(): void {
    this.tabGroup?.selectTab(this);
  }
}
