import { Module } from '@nestjs/common';
import { BetterLogger } from './better-logger.service';

@Module({
    imports: [],
    providers: [BetterLogger],
    exports: [BetterLogger],
})
export class BetterLoggerModule { }