import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-nothing-here',
  templateUrl: './nothing-here.component.html',
  styleUrls: ['./nothing-here.component.scss'],
  standalone: false,
})
export class NothingHereComponent implements OnInit {

  @Input() withBorders = false;

  constructor() { }

  ngOnInit(): void {
  }

}
