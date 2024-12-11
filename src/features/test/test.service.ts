import { Injectable } from '@nestjs/common';
import { AppLogger } from 'src/shared/app-logger/app-logger.service';

@Injectable()
export class TestService {
    constructor(
        private logger: AppLogger,
    ) {
        this.logger.setContext(TestService.name);
        this.logger.log('Created');
    }
}
