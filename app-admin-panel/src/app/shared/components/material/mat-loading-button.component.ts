import { AfterContentChecked, ViewEncapsulation } from '@angular/core';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

export type MatButtonType = 'default' | 'raised' | 'stroked' | 'lung-border';
export type MatColor = 'primary' | 'accent' | 'warn';
export type ButtonSize = 'default' | 'small';

@Component({
  selector: 'app-mat-loading-button',
  templateUrl: './mat-loading-button.component.html',
  styleUrls: ['./mat-loading-button.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None
})
export class MatLoadingButtonComponent implements OnInit, AfterContentChecked {

  readonly BUTTON_DEFAULT = 'default';
  readonly BUTTON_RAISED = 'raised';
  readonly BUTTON_STROKED = 'stroked';
  readonly BUTTON_LUNG_BORDER = 'lung-border';
  readonly SIZE_DEFAULT = 'default';
  readonly SIZE_SMALL = 'small';

  @Input() loading!: boolean;
  @Input() size: ButtonSize = 'default';
  @Input() disabled = false;
  @Input() type: MatButtonType = 'raised';
  @Input() color: MatColor = 'primary';
  @Output() actionSent: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit(): void {

  }

  ngAfterContentChecked(): void {

  }

  public action(): void {
    this.actionSent.emit();
  }

}
