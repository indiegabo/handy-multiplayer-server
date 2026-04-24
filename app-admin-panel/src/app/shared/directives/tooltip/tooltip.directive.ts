import { ComponentFactory, ComponentFactoryResolver, ComponentRef, Directive, ElementRef, HostListener, Input, ViewContainerRef } from '@angular/core';
import { TooltipComponent } from './tooltip.component'

@Directive({
  selector: '[appTooltip]',
  standalone: false,
})
export class TooltipDirective {
  @Input('tooltipTitle') title = '';
  @Input('tooltipDescription') description = '';

  @HostListener('mouseenter') onMouseEnter() {
    // Renders the component on mouse enter
    this.render();
  }

  @HostListener('mouseleave') onMouseLeave() {
    // destroys the component on mouse leave
    this.dismiss();
  }

  /**
   * The element wich holds the directive
   *
   * @var {HTMLElement}
   */
  private _mainElement: HTMLElement;

  /**
   * The Component factory
   *
   * @var {ComponentFactory<TooltipComponent>}
   */
  private dynamicComponentFactory: ComponentFactory<TooltipComponent>;

  /**
   * The tooltip component's instance
   *
   * @var {ComponentRef<TooltipComponent>}
   */
  private tooltipComponentRef?: ComponentRef<TooltipComponent>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private elementRef: ElementRef,
    public viewContainerRef: ViewContainerRef
  ) {
    this._mainElement = this.elementRef.nativeElement as HTMLElement;
    // Loads the component factory
    this.dynamicComponentFactory = this.componentFactoryResolver.resolveComponentFactory(TooltipComponent);
  }

  /**
   * Renders the tooltip component aside the element
   *
   * @return  {void}
   */
  private render(): void {
    this.tooltipComponentRef = this.viewContainerRef.createComponent<TooltipComponent>(this.dynamicComponentFactory);
    this.tooltipComponentRef.instance.mainElementRef = this.elementRef;
    this.tooltipComponentRef.instance.title = this.title;
    this.tooltipComponentRef.instance.description = this.description;
  }

  /**
   * Destroys the tooltip component
   *
   * @return  {void}
   */
  private dismiss(): void {
    if (this.tooltipComponentRef) {
      this.tooltipComponentRef.destroy();
      delete this.tooltipComponentRef;
    }
  }
}
