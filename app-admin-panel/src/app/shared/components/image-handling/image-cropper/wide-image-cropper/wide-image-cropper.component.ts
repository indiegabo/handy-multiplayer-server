import { Component, OnInit, Inject, Output, EventEmitter } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';

export interface ImageCropperData {
  file: File;
}

@Component({
  selector: 'app-wide-image-cropper',
  templateUrl: './wide-image-cropper.component.html',
  styleUrls: ['./wide-image-cropper.component.scss'],
  standalone: false,
})
export class WideImageCropperComponent implements OnInit {

  @Output() cropped: EventEmitter<string> = new EventEmitter<string>();

  public imageFile!: File;
  public croppedImage?: string | null | undefined;

  constructor(
    public dialogRef: MatDialogRef<WideImageCropperComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: ImageCropperData,
  ) {
    this.imageFile = data.file;
  }

  ngOnInit(): void {
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
  }

  imageLoaded(image: LoadedImage) {
    // show cropper
    console.log(image);
  }

  cropperReady() {
    // cropper ready
  }

  loadImageFailed() {
    // show message
  }

  public crop(): void {
    this.dialogRef.close(this.croppedImage);
  }

}
