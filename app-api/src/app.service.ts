import { Injectable } from '@nestjs/common';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  constructor(private logger: BetterLogger) {
    this.logger.setContext(AppService.name);
  }
}
