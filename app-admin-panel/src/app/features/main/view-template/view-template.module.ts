import { NgModule } from "@angular/core";
import { AppTopBarComponent } from "./app-top-bar/app-top-bar.component";
import { AppSidebarComponent } from "./app-sidebar/app-sidebar.component";
import { CommonModule } from "@angular/common";
import { SharedModule } from "src/app/shared/shared.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AppTopBarService } from "./app-top-bar.service";
import { RouterModule } from "@angular/router";

@NgModule({
  declarations: [
    AppTopBarComponent,
    AppSidebarComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    FontAwesomeModule,
  ],
  exports: [
    AppTopBarComponent,
    AppSidebarComponent
  ],
  providers: [
    AppTopBarService,
  ],
})
export class ViewTemplateModule { }
