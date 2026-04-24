import { Component, ElementRef, Input, OnInit, ViewEncapsulation, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None
})
export class TooltipComponent implements OnInit, AfterViewInit {

  @Input() mainElementRef?: ElementRef;
  @Input() title?: string;
  @Input() description!: string;

  private _mainElement?: HTMLElement;
  private _tooltipElement!: HTMLElement;
  private _elementParent?: HTMLElement;

  private _upLimit = 64;
  private _bottomLimit = window.innerHeight;
  private _xOffSet = 8;

  private _elementMiddlePos = 0;
  private _tooltipTopPos!: number;
  private _tootipBottomPos!: number;

  constructor(
    private tooltipElementRef: ElementRef
  ) {

  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.start();
  }

  private start(): void {
    this.loadElements();
    this.definePositions();
    this.placeTooltipY();
    this.placeTooltipX();
  }

  private loadElements(): void {
    this._mainElement = this.mainElementRef?.nativeElement as HTMLElement;
    this._tooltipElement = this.tooltipElementRef.nativeElement as HTMLElement;
    this._elementParent = this._mainElement.parentElement as HTMLElement;
    this._tooltipElement.style.position = 'absolute';
    this._tooltipElement.style.zIndex = '50';
  }

  private definePositions(): void {
    if (this._mainElement) {
      if (this._elementParent && this._elementParent.scrollTop) {
        this._elementMiddlePos = this._mainElement.offsetTop - this._elementParent.scrollTop + (this._mainElement.offsetHeight / 2);
      } else {
        this._elementMiddlePos = this._mainElement.offsetTop + (this._mainElement.offsetHeight / 2);
      }

      this._tooltipTopPos = this._elementMiddlePos - (this._tooltipElement.offsetHeight / 2);
      this._tootipBottomPos = this._elementMiddlePos + (this._tooltipElement.offsetHeight / 2);
    }
  }

  private placeTooltipY(): void {
    if (this._tooltipTopPos <= this._upLimit) {
      this._tooltipElement.style.top = this._upLimit + 'px';
    } else if (this._tooltipTopPos > this._upLimit && this._tootipBottomPos < this._bottomLimit) {
      this._tooltipElement.style.top = this._tooltipTopPos + 'px';
    } else if (this._tootipBottomPos >= this._bottomLimit) {
      this._tooltipElement.style.top = this._bottomLimit - this._tooltipElement.offsetHeight + 'px';
    }
  }

  private placeTooltipX(): void {
    if (this._mainElement) {
      this._tooltipElement.style.left = (this._mainElement.offsetWidth + this._xOffSet) + 'px';
    }
  }

}
