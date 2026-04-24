import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { GButtonMatColor } from '../handy-button/handy-button.component';

@Component({
  selector: 'handy-toggle-button',
  templateUrl: './handy-toggle-button.component.html',
  styleUrl: './handy-toggle-button.component.scss',
  standalone: false
})
export class HandyToggleButtonComponent {
  @Input() shouldBeActive = false;
  @Input({ required: true }) activeLabel!: string;
  @Input({ required: true }) inactiveLabel!: string;
  @Input() activeIcon?: IconProp;
  @Input() inactiveIcon?: IconProp;
  @Input() bordered = false;
  @Input() color: GButtonMatColor = 'none';
  @Input() disabled = false;
  @Output() toggled$ = new EventEmitter();
}
