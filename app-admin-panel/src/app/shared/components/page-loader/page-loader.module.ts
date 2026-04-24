import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageLoaderComponent } from './page-loader.component';
import { MaterialModule } from '../material/material.module';

@NgModule({
  declarations: [
    PageLoaderComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
  ],
  exports: [
    PageLoaderComponent
  ]
})
export class PageLoaderModule { }
