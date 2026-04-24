import { EventEmitter, Injectable } from '@angular/core';

export const MUST_BE_COMPLETELLY_VISIBLE = true;
export interface ScrollVisibilityConfig {
  element: HTMLElement,
  parent?: HTMLElement,
  offset?: number;
  comepletlyVisible?: boolean;
}
@Injectable({
  providedIn: 'root'
})
export class ScrollingService {

  private _windowScroll = 0;
  public windowScrolled$ = new EventEmitter<number>();

  constructor() { }

  /**
   * Animates Scrolling to an HTML Element
   *
   * @param   {HTMLElement}  element
   *
   * @return  {void}
   */
  public smoothlyScrollToElement(element: HTMLElement): void {
    const startingY = window.pageYOffset;
    const diff = element.offsetTop - startingY - 120;
    const duration = 800;
    let start: number;

    // Bootstrap our animation - it will get called right before next frame shall be rendered.
    window.requestAnimationFrame(function step(timestamp) {
      if (!start) start = timestamp;
      // Elapsed milliseconds since start of scrolling.
      var time = timestamp - start;
      // Get percent of completion in range [0, 1].
      var percent = Math.min(time / duration, 1);

      window.scrollTo(0, startingY + diff * percent);

      // Proceed with animation as long as we wanted it to.
      if (time < duration) {
        window.requestAnimationFrame(step);
      }
    })
  }

  /**
   * Returns if an HTML Element is visible on viewport
   *
   * @param   {HTMLElement}  element  The HTML Element we wanna check
   * @param   {boolean}      visible  Boolean determining either it should olnly consider fully visible elements. Default false.
   *
   * @return  {boolean}
   */
  public isElementVisible(config: ScrollVisibilityConfig): boolean {
    const pageBottom = this.windowScrollY + window.innerHeight;
    let elementTop = (config.parent) ? config.element.offsetTop + config.parent.offsetTop : config.element.offsetTop;
    elementTop += (config.offset) ? config.offset : 0;
    const elementBottom = elementTop + config.element.offsetHeight;

    if (config.comepletlyVisible) {
      return ((this.windowScrollY < elementTop) && (pageBottom > elementBottom));
    } else {
      return ((elementTop <= pageBottom) && (elementBottom >= this.windowScrollY));
    }
  }

  // Getters and Setters

  public set windowScrollY(scrollY: number) {
    this._windowScroll = scrollY;
    this.windowScrolled$.emit(this.windowScrollY);
  }

  public get windowScrollY(): number {
    return this._windowScroll;
  }
}
