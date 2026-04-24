import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { CropPerformedEvent } from '../image-cropped-event';

type Size = {
    width: number;
    height: number;
};

@Component({
    selector: 'app-portrait-image-cropper',
    templateUrl: './portrait-image-cropper.component.html',
    styleUrls: ['./portrait-image-cropper.component.scss'],
    standalone: false,
})
export class PortraitImageCropperComponent implements OnInit {

    @Input({ 'required': true }) file!: File;
    @Input() size: Size = { width: 400, height: 600 };
    @Input() exportSize: Size = { width: 400, height: 600 };
    @Output() cropped = new EventEmitter<CropPerformedEvent>();

    public croppedImage64?: string;

    constructor() { }

    ngOnInit(): void { }

    imageCropped(event: ImageCroppedEvent) {
        if (!event.base64) return;

        this.cropped.emit({
            image64: event.base64,
            filename: this.file.name,
        });
    }

    imageLoaded(image: LoadedImage) {
        // show cropper
    }

    cropperReady() {
        // ready
    }

    loadImageFailed() {
        // show message
    }
}
