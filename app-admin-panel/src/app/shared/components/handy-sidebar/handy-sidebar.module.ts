import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MaterialModule } from "../material/material.module";
import { CommonModule } from "@angular/common";
import { HandySidebarComponent } from "./handy-sidebar.component";
import { NgModule } from "@angular/core";
import { NavigationModule } from "../navigation/navigation.module";

@NgModule({
  imports: [
    CommonModule,
    FontAwesomeModule,
    MaterialModule,
    NavigationModule,
  ],
  declarations: [HandySidebarComponent],
  exports: [HandySidebarComponent]
})
export class HandySidebarModule { }
