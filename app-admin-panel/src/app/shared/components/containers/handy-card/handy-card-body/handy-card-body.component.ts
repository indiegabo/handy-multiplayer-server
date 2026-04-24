import { Component } from '@angular/core';
import { HandyCardComponent } from '../handy-card.component';

@Component({
    selector: 'handy-card-body',
    templateUrl: './handy-card-body.component.html',
    styleUrl: './handy-card-body.component.scss',
    standalone: false
})
export class HandyCardBodyComponent {

  init(handyCard: HandyCardComponent): void { }
}
