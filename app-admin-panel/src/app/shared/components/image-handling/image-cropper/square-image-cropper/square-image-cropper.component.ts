import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CropPerformedEvent } from '../image-cropped-event';

type Size = {
  width: number;
  height: number;
};

@Component({
  selector: 'app-square-image-cropper',
  templateUrl: './square-image-cropper.component.html',
  styleUrls: ['./square-image-cropper.component.scss'],
  standalone: false,
})
export class SquareImageCropperComponent implements OnInit {

  @Input({ 'required': true }) file!: File;
  @Input() size: Size = { width: 250, height: 250 };
  @Input() exportSize: Size = { width: 250, height: 250 };
  @Output() cropped = new EventEmitter<CropPerformedEvent>();

  croppedImagePreview: SafeUrl = '';
  croppedImage64?: string;

  constructor(
    private sanitizer: DomSanitizer
  ) {
  }

  ngOnInit(): void {
  }

  imageCropped(event: ImageCroppedEvent) {
    if (!event.base64) return

    this.cropped.emit({
      image64: event.base64,
      filename: this.file.name
    });
  }

  imageLoaded(image: LoadedImage) {
    // show cropper
    // console.log(image);
  }

  cropperReady() {
    // cropper ready
  }

  loadImageFailed() {
    // show message
  }
}
