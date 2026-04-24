import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoundAvatarComponent } from './round-avatar/round-avatar.component';
import { UserAvatarComponent } from './user-avatar/user-avatar.component';
import { MaterialModule } from '../material/material.module';



@NgModule({
  declarations: [
    RoundAvatarComponent,
    UserAvatarComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,

  ],
  exports: [
    RoundAvatarComponent,
    UserAvatarComponent
  ]
})
export class AvatarsModule { }
