import { trigger, state, animate, transition, style, stagger, query } from '@angular/animations';
import { _defaultParams } from '@angular/material/dialog';

export const fadeIn = trigger('fadeIn', [
  state('in', style({ opacity: 1 })),
  state('out', style({ opacity: 0 })),
  transition(':enter', [
    style({ opacity: 0 }),
    animate('{{duration}} {{inDelay}} ease-in', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    style({ opacity: 1 }),
    animate('{{duration}} {{outDelay}} ease-in', style({ opacity: 0 }))
  ]),
  transition('out => in', [
    animate('{{duration}}  {{inDelay}}  ease-in-out', style({ opacity: 1, 'z-index': 0 }))
  ]),
  transition('int => out', [
    animate('{{duration}} {{outDelay}} ease-in', style({ opacity: 0, 'z-index': 0 })),
  ]),
]);
