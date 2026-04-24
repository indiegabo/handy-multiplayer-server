import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { AlertsService } from 'src/app/core/services/alerts.service';
export type AllowedDropFormat = 'png' | 'jpg' | 'jpeg' | 'avif';

@Component({
  selector: 'app-image-dropzone',
  templateUrl: './image-dropzone.component.html',
  styleUrls: ['./image-dropzone.component.scss'],
  standalone: false,
})
export class ImageDropzoneComponent implements OnInit {

  @Input('acceptedFormats') public acceptedFormats: AllowedDropFormat[] = [
    'jpeg', 'jpg', 'png', 'avif'
  ];
  @Output('dropDone') dropDone = new EventEmitter<File>();

  acceptedFormatsString?: string;
  isOver = false;

  constructor(
    private translateService: TranslateService,
    private alertsService: AlertsService,
  ) {
  }

  ngOnInit(): void {
    this.generateFormatString();
  }

  private generateFormatString(): void {
    let formatsString = '';
    for (let i = 0; i < this.acceptedFormats.length; i++) {
      if (i < this.acceptedFormats.length - 1) {
        formatsString += '.' + this.acceptedFormats[i] + ',';
      } else {
        formatsString += '.' + this.acceptedFormats[i];
      }
    }
    this.acceptedFormatsString = formatsString;
  }

  /**
   * Called if image dropped on Dropzone. This function will check
   * if the dropped file's extension is present on the component's
   * 'acceptedFormats' array.
   *
   * @param   {NgxFileDropEntry[]}  files  The dropped files array (from wich will always be fetched its first position)
   *
   * @return  {void}                       void
   */
  public droppedImage(files: NgxFileDropEntry[]): void {
    const droppedImage = files[0].fileEntry as FileSystemFileEntry;
    // Gets the str after the last '.' in the dropped images name and consider it
    // the file extension.
    const splitStr = droppedImage.name.split('.');
    const extension = splitStr[splitStr.length - 1];
    if (this.acceptedFormats.includes(extension.toLowerCase() as AllowedDropFormat)) {
      droppedImage.file((file: File) => {
        this.dropDone.emit(file);
      });
    } else {
      this.alertsService.alert(this.translateService.instant('image-dropzone.errors.format-not-allowed'), this.translateService.instant('general.close'));
    }
  }

  public imageOverZone(event: any): void {
    this.isOver = true;
  }

  public imageLeftZone(event: any): void {
    this.isOver = false;
  }
}
