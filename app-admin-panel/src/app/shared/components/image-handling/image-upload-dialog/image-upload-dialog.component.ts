import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { catchError, delay, finalize, Observable, of } from 'rxjs';
import { CropPerformedEvent } from '../image-cropper/image-cropped-event';
import { SafeUrl } from '@angular/platform-browser';
import { AlertsService } from 'src/app/core/services/alerts.service';

type DialogData = {
  imageAspect: 'square' | 'wide',
  uploader: (imageData: string, filename: string) => Observable<string>,
  title?: string;
}

@Component({
  selector: 'app-image-upload-dialog',
  templateUrl: './image-upload-dialog.component.html',
  styleUrl: './image-upload-dialog.component.scss',
  standalone: false,
})
export class ImageUploadDialogComponent {

  loading = false;
  file?: File;
  image64?: string;

  constructor(
    private dialogRef: MatDialogRef<ImageUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private alertsService: AlertsService
  ) {
  }

  onFileDrop(file: File) {
    this.file = file;
  }

  onCroppedPerformed(event: CropPerformedEvent) {
    this.image64 = event.image64;

    // this.previewImage = event.previewImage;
  }

  clearImage() {
    delete this.file;
    delete this.image64;
  }

  close() {
    this.dialogRef.close();
  }

  save() {
    if (!this.image64 || !this.file) return;

    this.loading = true;

    this.data.uploader(this.image64, this.file.name).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (url) => {
        if (!url) return;
        this.dialogRef.close(url);
      },
      error: (error) => this.alertsService.alertErrorResponse(error)
    })
  }
}
