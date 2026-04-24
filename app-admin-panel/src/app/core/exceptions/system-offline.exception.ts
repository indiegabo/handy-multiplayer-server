import { SystemStatus } from "@hms/shared-types/hms";


export class SystemOfflineException extends Error {
  constructor(public readonly systemStatus: SystemStatus) {
    super(`System unavailable (Status: ${SystemStatus[systemStatus]})`);
    this.name = 'SystemOfflineException';
    Object.setPrototypeOf(this, SystemOfflineException.prototype);
  }
}

