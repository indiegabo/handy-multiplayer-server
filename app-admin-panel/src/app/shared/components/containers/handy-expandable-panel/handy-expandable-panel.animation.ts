import { animate, state, style, transition, trigger } from "@angular/animations";

export const expandCollapse = trigger('expandCollapse', [
  state('expanded', style({ height: '*' })),
  state('collapsed', style({ height: 0 })),
  transition('expanded <=> collapsed', animate('250ms ease-in-out')),
]);

export const rotate = trigger('rotate', [
  state('expanded', style({ transform: 'rotate(0deg)' })),
  state('collapsed', style({ transform: 'rotate(180deg)' })),
  transition('expanded <=> collapsed', animate('250ms ease-in-out')),
]);
