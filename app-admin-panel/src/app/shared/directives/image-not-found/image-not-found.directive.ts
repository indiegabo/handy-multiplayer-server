import { Directive, ElementRef } from '@angular/core';
import { environment } from 'src/environments/environment';

@Directive({
  selector: '[appImageNotFound]'
})
export class ImageNotFoundDirective {

  constructor(
    private elementRef: ElementRef
  ) {
    this.elementRef.nativeElement.setAttribute('src', this.imageNotFoundUrl);
  }

  public get imageNotFoundUrl(): string {
    return '/404';
  }
}
