import { Component, EventEmitter, Input, Output } from '@angular/core';

export type GButtonMatColor = 'primary' | 'accent' | 'warn' | 'none';
export type ButtonSize = 'default' | 'small';

@Component({
  selector: 'handy-button',
  templateUrl: './handy-button.component.html',
  styleUrl: './handy-button.component.scss',
  standalone: false
})
export class HandyButtonComponent {
  readonly SIZE_DEFAULT = 'default';
  readonly SIZE_SMALL = 'small';

  @Input() loading: boolean | null = false;
  @Input() size: ButtonSize = 'default';
  @Input() disabled: boolean | null = false;
  @Input() color: GButtonMatColor = 'none';
  @Input() bordered = true;
  @Input() tooltip: string = '';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() actionSent: EventEmitter<any> = new EventEmitter();

  constructor() { }

  public action(event: Event): void {
    if (this.type !== 'submit') {
      event.preventDefault();
    }

    if (this.disabled) return;
    this.actionSent.emit();
  }
}
