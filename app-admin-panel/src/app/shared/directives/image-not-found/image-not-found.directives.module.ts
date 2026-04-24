import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageNotFoundDirective } from './image-not-found.directive';

@NgModule({
  declarations: [
    ImageNotFoundDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ImageNotFoundDirective
  ]
})
export class ImageNotFoundDirectivesModule { }
