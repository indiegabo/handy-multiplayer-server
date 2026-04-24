import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-image-not-found',
  templateUrl: './image-not-found.component.html',
  styleUrls: ['./image-not-found.component.scss'],
  standalone: false,
})
export class ImageNotFoundComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  public get imageNotFoundUrl(): string {
    // return environment.APP_IMAGES_ENDPOINT + '/404';
    return '/404';
  }


}
