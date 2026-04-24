import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LungLoaderDirective } from './lung-loader.directive';
import { TextLoaderComponent } from './text-loader/text-loader.component';



@NgModule({
  declarations: [
    LungLoaderDirective,
    TextLoaderComponent,
  ],
  imports: [
    CommonModule,

  ],
  exports: [
    LungLoaderDirective,
    TextLoaderComponent,
  ]
})
export class LoadersModule { }
