import { Module } from '@nestjs/common';
import { GenericValidatorService } from './generic-validator.service';
import { BetterLoggerModule } from '../better-logger/better-logger.module';

@Module({
    imports: [BetterLoggerModule],
    providers: [GenericValidatorService],
    exports: [GenericValidatorService],
})
export class GenericValidationsModule { }
