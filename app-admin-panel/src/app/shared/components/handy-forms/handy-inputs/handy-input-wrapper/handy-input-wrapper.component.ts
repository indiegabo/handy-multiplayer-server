import { AfterContentInit, Component, ContentChild, ContentChildren, ElementRef, EventEmitter, Input, Output, Query, QueryList } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { HandyInputDirective } from '../handy-input.directive';
import { HandyInputActionButtonComponent } from '../handy-input-action-button/handy-input-action-button.component';

@Component({
  selector: 'handy-input-wrapper',
  templateUrl: './handy-input-wrapper.component.html',
  styleUrl: './handy-input-wrapper.component.scss',
  standalone: false
})
export class HandyInputWrapperComponent implements AfterContentInit {

  @Input('formControl') control?: AbstractControl;
  @Input() applyMargin = true;
  @ContentChild(HandyInputDirective) inputDirective?: HandyInputDirective;
  @ContentChild(HandyInputActionButtonComponent) actionButton?: HandyInputActionButtonComponent;

  inputElement?: HTMLInputElement;

  ngAfterContentInit(): void {
    this.initializeInputElement();
  }

  private initializeInputElement(): void {
    if (!this.inputDirective) return;
    this.inputElement = this.inputDirective.element.nativeElement as HTMLInputElement;
    this.inputElement.classList.add('g-input');
    if (this.actionButton) {
      this.inputElement.style.paddingRight = '30px';
    }
  }
}
