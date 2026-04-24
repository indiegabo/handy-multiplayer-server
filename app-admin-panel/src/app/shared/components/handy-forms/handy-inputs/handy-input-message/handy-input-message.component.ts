import { Component, Input } from '@angular/core';

@Component({
  selector: 'handy-input-message',
  templateUrl: './handy-input-message.component.html',
  styleUrl: './handy-input-message.component.scss',
  standalone: false
})
export class HandyInputMessageComponent {
  @Input('type') type: 'error' | 'warning' | 'success' = 'warning';
  @Input('isLast') isLast?: boolean;
}
