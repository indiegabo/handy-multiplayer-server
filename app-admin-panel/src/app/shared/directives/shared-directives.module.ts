import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { TooltipModule } from "./tooltip/tooltip.module";
import { CheckIconModule } from "./check-icon/check-icon.module";
import { ImageHandlingModule } from "../components/image-handling/image-handling.module";

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ],
  exports: [
    MatDatepickerModule,
    TooltipModule,
    ImageHandlingModule,
    CheckIconModule,
  ],
})
export class SharedDirectivesModule { }
