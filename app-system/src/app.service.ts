import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {

  private _isProduction: boolean;

  get isProduction() {
    return this._isProduction ??=
      this.configService.get('APP_ENVIRONMENT') === 'production';
  }

  constructor(private configService: ConfigService) { }
}
