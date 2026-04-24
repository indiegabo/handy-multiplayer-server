import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[lungLoader]',
  standalone: false,
})
export class LungLoaderDirective implements OnInit {
  @Input() darkenBG?: boolean;
  @Input() size: 'normal' | 'small' | 'large' = 'normal';

  constructor(
    private element: ElementRef,
    private renderer: Renderer2,
  ) {
  }

  ngOnInit(): void {
    this.element.nativeElement.classList.add('lung-loader-wrapper');

    const div = this.renderer.createElement('div');

    div.classList.add('lung-loader');
    switch (this.size) {
      case 'small':
        div.classList.add('small');
        break;
      case 'large':
        div.classList.add('large');
        break;
      default:
        div.classList.add('normal');
        break;
    }
    if (this.darkenBG) {
      this.element.nativeElement.classList.add('bg-dark');
    }

    this.renderer.appendChild(this.element.nativeElement, div);
  }
}
