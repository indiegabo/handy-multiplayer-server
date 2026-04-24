import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-page-loader',
  templateUrl: './page-loader.component.html',
  styleUrls: ['./page-loader.component.scss'],
  standalone: false,
  encapsulation: ViewEncapsulation.None
})
export class PageLoaderComponent implements OnInit {

  @Input('active') active = false;

  constructor() { }

  ngOnInit(): void {
  }

}
