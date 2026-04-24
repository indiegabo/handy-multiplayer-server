import { Component, Input } from '@angular/core';

type MessageBoxType = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
  styleUrl: './message-box.component.scss',
  standalone: false,
})
export class MessageBoxComponent {
  @Input() type: MessageBoxType = 'info';
  @Input({ required: true }) title!: string;
  @Input() iconName = 'info';
}
