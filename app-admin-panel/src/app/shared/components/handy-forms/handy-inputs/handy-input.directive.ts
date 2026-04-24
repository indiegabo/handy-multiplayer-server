import { Directive, ElementRef, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[handyInput]',
  standalone: false
})
export class HandyInputDirective implements OnInit, OnChanges {
  @Input() fullWidth?: boolean;
  @Input() errorCondition?: boolean | ValidationErrors | null;

  constructor(public element: ElementRef) {
  }

  ngOnInit(): void {
    this.element.nativeElement.classList.add('handy-input');

    if (this.fullWidth) {
      this.element.nativeElement.classList.add('full-width');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['errorCondition'] && this.errorCondition) {
      this.element.nativeElement.classList.add('error');
    }
    else if (changes['errorCondition'] && !this.errorCondition) {
      this.element.nativeElement.classList.remove('error');
    }
  }
}
