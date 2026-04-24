import { Component, Input } from '@angular/core';
import { fadeIn } from '../../animations/fade.animation';

@Component({
  selector: 'app-check-icon',
  templateUrl: './check-icon.component.html',
  styleUrl: './check-icon.component.scss',
  standalone: false,
  animations: [fadeIn]
})
export class CheckIconComponent {
  @Input() marked = false;

  fadeInParams = {
    value: 'in',
    params: {
      duration: '200ms',
      inDelay: '100ms',
      outDelay: '100ms'
    }
  }
}
