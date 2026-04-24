import { Component, Input } from '@angular/core';
import { TabContentWrapperComponent } from '../tab-content-wrapper/tab-content-wrapper.component';

@Component({
  selector: 'app-tab-content',
  templateUrl: './tab-content.component.html',
  styleUrl: './tab-content.component.scss',
  standalone: false
})
export class TabContentComponent {
  @Input({ alias: 'forTab', required: true }) forTab!: string;

  active = false;
  wrapper?: TabContentWrapperComponent;

  activate(): void {
    this.active = true;
  }

  dismiss(): void {
    this.active = false;
  }
}
