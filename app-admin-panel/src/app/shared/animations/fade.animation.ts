import { trigger, state, animate, transition, style, stagger, query } from '@angular/animations';

export const fadeIn = trigger('fadeIn', [
  state('in', style({ opacity: 1 })),
  state('out', style({ opacity: 0 })),
  transition(':enter', [
    style({ opacity: 0 }),
    animate('{{inDuration}} {{inDelay}} ease-in-out', style({ opacity: 1 }))
  ]),
  transition(':leave', [
    style({ opacity: 1 }),
    animate('{{outDuration}} {{outDelay}} ease-in', style({ opacity: 0 }))
  ]),
  transition('out => in', [
    animate('{{inDuration}}  {{inDelay}}  ease-in-out', style({ opacity: 1, 'z-index': 0 }))
  ]),
  transition('int => out', [
    animate('{{outDuration}} {{outDelay}} ease-in', style({ opacity: 0, 'z-index': 0 })),
  ]),
]);

export const fadeInDefaultParams = {
  value: 'in',
  params: {
    inDuration: '200ms',
    inDelay: '0ms',
    outDuration: '0ms',
    outDelay: '0ms',
  }
}

