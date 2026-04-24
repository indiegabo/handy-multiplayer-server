import { Module } from '@nestjs/common';
import { OneTimeTokensService } from './one-time-tokens.service';
import { BetterLoggerModule } from '../better-logger/better-logger.module';
import { OneTimeTokenGeneratorService } from './one-time-token-generartor.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule,
    BetterLoggerModule,
  ],
  providers: [
    OneTimeTokenGeneratorService,
    OneTimeTokensService,
  ],
  exports: [OneTimeTokensService],
})
export class OneTimeTokensModule { }
