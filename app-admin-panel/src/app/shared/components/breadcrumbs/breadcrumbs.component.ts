import { Component, Input, OnInit } from '@angular/core';
import { fadeIn } from 'src/app/shared/animations/fade.animation';
import { Breadcrumb } from './breadcrumbs';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
  standalone: false,
  animations: [fadeIn]
})
export class BreadcrumbsComponent implements OnInit {

  @Input('breadcrumbs') breadcrumbs: Breadcrumb[] = [];

  constructor() { }

  ngOnInit(): void {
  }


  trackByIndex(index: number, item: any): any {
    return index;
  }
}
