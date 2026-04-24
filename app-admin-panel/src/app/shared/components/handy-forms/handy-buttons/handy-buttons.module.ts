import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MaterialModule } from "../../material/material.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HandyButtonComponent } from "./handy-button/handy-button.component";
import { HandyToggleButtonComponent } from "./handy-toggle-button/handy-toggle-button.component";

@NgModule({
  declarations: [HandyButtonComponent, HandyToggleButtonComponent],
  imports: [
    CommonModule,

    MaterialModule,
    FontAwesomeModule
  ],
  exports: [HandyButtonComponent, HandyToggleButtonComponent]
})
export class HandyButtonsModule {
}
