import { Component } from '@angular/core';
import { HandyCardComponent } from '../handy-card.component';

@Component({
  selector: 'handy-card-header',
  templateUrl: './handy-card-header.component.html',
  styleUrl: './handy-card-header.component.scss',
  standalone: false
})
export class HandyCardHeaderComponent {

  init(handyCard: HandyCardComponent): void { }
}
