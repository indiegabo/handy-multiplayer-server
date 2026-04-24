import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

@Component({
    selector: 'handy-input-action-button',
    templateUrl: './handy-input-action-button.component.html',
    styleUrl: './handy-input-action-button.component.scss',
    standalone: false
})
export class HandyInputActionButtonComponent {
  @Input({ required: true }) icon!: IconProp;
  @Input() disabled = false;
  @Output() action$ = new EventEmitter();

  emitAction(): void {
    this.action$.emit();
  }
}
