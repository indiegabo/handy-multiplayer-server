import { trigger, animate, transition, style, state, query, stagger } from '@angular/animations';

export const slide = trigger('slide', [
  state('left', style({ transform: 'translateX(-100%)' })),
  state('right', style({ transform: 'translateX(100%)' })),
  state('visible', style({ transform: 'translateX(0%)' })),
  transition('visible => right', [
    animate('{{ duration }} ease-in')
  ]),
  transition('visible => left', [
    animate('{{ duration }} ease-in')
  ]),
  transition('right => visible', [
    animate('{{ duration }} ease-in')
  ]),
  transition('left => visible', [
    animate('{{ duration }} ease-in')
  ]),
]);

export const slideRight = trigger('slideRight', [
  state('in', style({ transform: 'translateX(0%)' })),
  state('out', style({ transform: 'translateX(100%)' })),
  transition(':enter', [
    style({ transform: 'translateX(100%)' }),
    animate('{{duration}} ease-in', style({ transform: 'translateX(0%)' }))
  ]),
  transition(':leave', [
    animate('{{duration}} {{outDelay}} ease-in', style({ transform: 'translateX(100%)' }))
  ]),
  transition('out => in', [
    animate('{{ duration }} {{inDelay}} ease-in')

  ]),
  transition('in => out', [
    animate('{{ duration }} {{outDelay}} ease-in')
  ])
]);

export const slideLeft = trigger('slideLeft', [
  state('in', style({ transform: 'translateX(0%)' })),
  state('out', style({ transform: 'translateX(-100%)' })),
  transition(':enter', [
    style({ transform: 'translateX(-100%)' }),
    animate('{{duration}} ease-in', style({ transform: 'translateX(0%)' }))
  ]),
  transition(':leave', [
    animate('{{duration}} {{outDelay}} ease-in', style({ transform: 'translateX(-100%)' }))
  ]),
  transition('out => in', [
    animate('{{ duration }} {{inDelay}} ease-in')

  ]),
  transition('in => out', [
    animate('{{ duration }} {{outDelay}} ease-in')
  ])
]);

export const slideTop = trigger('slideTop', [
  transition(':enter', [
    style({ transform: 'translateY(-100%)' }),
    animate('500ms ease-in', style({ transform: 'translateY(0%)' }))
  ]),
  transition(':leave', [
    animate('500ms ease-in', style({ transform: 'translateY(-100%)' }))
  ])
]);

export const expandAndShrink = trigger('expandAndShrink', [
  state('shrink', style({
    flex: '0 1 100%',
    'max-width': '80%'
  })),
  state('expand', style({
    flex: '1 0 100%',
    'max-width': '100%'
  })),
  transition('* => shrink',
    animate('1000ms ease-in'),
  ),
  transition('* => expand',
    animate('1200ms ease-in'),
  )
]);

export const listSlideInLeftCascade = trigger('listSlideInLeftCascade', [
  transition(':enter', [
    query('.cascade-container ', [
      style({ transform: 'translateX(-100%)' }),
      stagger(30, [
        animate('500ms', style({ transform: 'translateX(0%)' }))
      ])
    ], { optional: true })
  ])
]);

export const listSlideInLeftCascadeSlow = trigger('listSlideInLeftCascadeSlow', [
  transition(':enter', [
    query('.cascade-container ', [
      style({ transform: 'translateX(-100%)' }),
      stagger(100, [
        animate('500ms', style({ transform: 'translateX(0%)' }))
      ])
    ], { optional: true })
  ])
]);

