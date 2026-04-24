import { Injectable } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { DeviceInfo } from 'ngx-device-detector/public-api';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  readonly DEVICE_ID_KEY = 'device_id';

  private _deviceInfo: DeviceInfo;
  private _id: string;

  constructor(
    private deviceDetectorService: DeviceDetectorService
  ) {
    this._deviceInfo = this.deviceDetectorService.getDeviceInfo();
    this._id = this.evaluate();
  }

  private evaluate(): string {
    const existingId = localStorage.getItem(this.DEVICE_ID_KEY);

    if (existingId) {
      return existingId;
    }

    let id = `${this._deviceInfo.os_version}`;

    if (this._deviceInfo.browser && this._deviceInfo.browser !== '') {
      id = `${this._deviceInfo.browser}_${id}`;
    }

    if (this._deviceInfo.deviceType && this._deviceInfo.deviceType.toLowerCase() !== 'unknown') {
      id = `${this._deviceInfo.deviceType}_${id}`;
    }

    if (this._deviceInfo.device && this._deviceInfo.device.toLowerCase() !== 'unknown') {
      id = `${this._deviceInfo.device}_${id}`;
    }

    localStorage.setItem(this.DEVICE_ID_KEY, id);
    return id;
  }

  public get id(): string {
    return this._id;
  }
}
