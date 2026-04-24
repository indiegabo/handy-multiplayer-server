import { Component, Input, OnDestroy } from '@angular/core';
import { ToggleButtonsGroupComponent } from '../toggle-buttons-group/toggle-buttons-group.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrl: './toggle-button.component.scss',
  standalone: false,
})
export class ToggleButtonComponent implements OnDestroy {
  @Input({ required: true }) value!: any;

  group?: ToggleButtonsGroupComponent;
  isActive = false;

  private groupSubscription?: Subscription;

  constructor() { }

  ngOnDestroy(): void {
    this.groupSubscription?.unsubscribe();
  }

  setGroup(group: ToggleButtonsGroupComponent): void {
    this.group = group;
  }

  setActive(isActive: boolean): void {
    this.isActive = isActive;
  }

  onClick(): void {
    this.isActive = true;
    this.group?.selectButton(this);
  }
}
