import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SquareImageCropperComponent } from "./image-cropper/square-image-cropper/square-image-cropper.component";
import { WideImageCropperComponent } from "./image-cropper/wide-image-cropper/wide-image-cropper.component";
import { PortraitImageCropperComponent } from "./image-cropper/portrait-image-cropper/portrait-image-cropper.component";
import { ImageDropzoneComponent } from "./image-dropzone/image-dropzone.component";
import { ImageNotFoundComponent } from "./image-not-found/image-not-found.component";
import { NgxFileDropModule } from "ngx-file-drop";
import { MaterialModule } from "../material/material.module";
import { ImageCropperComponent } from "ngx-image-cropper";
import { LoadersModule } from "../loaders/loaders.module";
import { ImageUploadDialogComponent } from "./image-upload-dialog/image-upload-dialog.component";
import { ImageCropDialogComponent } from "./image-crop-dialog/image-crop-dialog.component";
import { AvatarsModule } from "../avatars/avatars.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { HandyFormsModule } from "../handy-forms/handy-forms.module";

@NgModule({
  declarations: [
    SquareImageCropperComponent,
    WideImageCropperComponent,
    PortraitImageCropperComponent,
    ImageDropzoneComponent,
    ImageNotFoundComponent,
    ImageUploadDialogComponent,
    ImageCropDialogComponent,
  ],
  imports: [
    CommonModule,

    ImageCropperComponent,
    NgxFileDropModule,
    MaterialModule,
    LoadersModule,
    HandyFormsModule,
    AvatarsModule,
    FontAwesomeModule,
  ],
  exports: [
    SquareImageCropperComponent,
    WideImageCropperComponent,
    PortraitImageCropperComponent,
    ImageDropzoneComponent,
    ImageNotFoundComponent,
    ImageUploadDialogComponent,
    ImageCropDialogComponent,
  ]
})
export class ImageHandlingModule { }
