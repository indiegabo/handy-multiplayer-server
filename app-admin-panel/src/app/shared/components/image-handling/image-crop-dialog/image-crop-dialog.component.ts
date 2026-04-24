import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImageCroppedEvent } from 'ngx-image-cropper';

export type ImageCropDialogData = {
    file: File;
    aspectRatio: number; // e.g., 16/9 or 2/3
    title?: string;
};

@Component({
    selector: 'app-image-crop-dialog',
    templateUrl: './image-crop-dialog.component.html',
    styleUrls: ['./image-crop-dialog.component.scss'],
    standalone: false,
})
export class ImageCropDialogComponent {
    public cropped?: string | null;

    constructor(
        private dialogRef: MatDialogRef<ImageCropDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ImageCropDialogData,
    ) { }

    imageCropped(event: ImageCroppedEvent) {
        this.cropped = event.base64 ?? null;
    }

    private dataUrlToImage(dataUrl: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (err) => reject(err);
            img.src = dataUrl;
        });
    }

    private canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, type, quality);
        });
    }

    private blobToDataUrl(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(blob);
        });
    }

    private async convertBase64ToAvif(base64DataUrl: string): Promise<string | null> {
        try {
            const img = await this.dataUrlToImage(base64DataUrl);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Try to produce AVIF via canvas. Some browsers support this.
            const blob = await this.canvasToBlob(canvas, 'image/avif', 0.92);
            if (!blob) return null;

            const avifDataUrl = await this.blobToDataUrl(blob);
            return avifDataUrl;
        } catch (e) {
            return null;
        }
    }

    async save(): Promise<void> {
        if (!this.cropped) return;

        // Attempt client-side AVIF conversion. Fallback to original base64 if not supported.
        const avif = await this.convertBase64ToAvif(this.cropped);
        this.dialogRef.close(avif ?? this.cropped);
    }

    cancel() {
        this.dialogRef.close();
    }
}
