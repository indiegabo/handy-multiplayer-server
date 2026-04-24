import { ComponentFactoryResolver, ComponentRef, Directive, ElementRef, Injector, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { CheckIconComponent } from './check-icon.component';

@Directive({
  selector: '[appCheckIcon]',
  standalone: false,
})
export class CheckIconDirective {

  @Input('checkIconMarked') set marked(isMarked: boolean) {
    this._marked = isMarked;
    if (this.componentRef) {
      this.componentRef.instance.marked = isMarked;
    }
  }

  private _marked = false;
  private _mainElement: HTMLElement;
  private componentRef?: ComponentRef<CheckIconComponent>;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private elementRef: ElementRef,
    private injector: Injector,
  ) {
    this._mainElement = this.elementRef.nativeElement as HTMLElement;
    this.elementRef.nativeElement.style.position = 'relative';
  }

  ngOnInit() {
    this.componentRef = this.viewContainerRef.createComponent(CheckIconComponent, { injector: this.injector });
    this.componentRef.instance.marked = this._marked;
    this.viewContainerRef.element.nativeElement.appendChild(this.componentRef.location.nativeElement);
  }
}
