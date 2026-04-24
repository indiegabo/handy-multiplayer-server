import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NavigationItemComponent } from './navigation-item/navigation-item.component';
import { NavigationItemShortComponent } from './navigation-item-short/navigation-item-short.component';
import { MaterialModule } from '../material/material.module';



@NgModule({
  declarations: [NavigationItemComponent, NavigationItemShortComponent],
  imports: [
    CommonModule,
    MaterialModule,

    FontAwesomeModule,
    TranslateModule,
  ],
  exports: [NavigationItemComponent, NavigationItemShortComponent]
})
export class NavigationModule { }
