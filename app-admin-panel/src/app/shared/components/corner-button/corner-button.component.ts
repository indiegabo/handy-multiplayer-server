import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-corner-button',
  templateUrl: './corner-button.component.html',
  styleUrls: ['./corner-button.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None,
})
export class CornerButtonComponent implements OnInit {

  @Input('tooltip') tooltip?: string;
  @Input('icon') iconName?: string;
  @Output('action') action = new EventEmitter<any>();

  public definedIcon?: string;

  constructor() { }

  ngOnInit(): void {
    this.definedIcon = (this.iconName) ? this.iconName : 'cancel';
  }

  public onClick(): void {
    this.action.emit();
  }
}
