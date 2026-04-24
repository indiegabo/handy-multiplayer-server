import { Module } from '@nestjs/common';
import { BetterLoggerModule } from '@hms-module/modules/better-logger/better-logger.module';
import { ScopedTokenRepository } from './scoped-tokens.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScopedToken } from './entities/scoped-token.entity';
import { ScopedTokensService } from './scoped-tokens.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ScopedToken]),
        BetterLoggerModule,
    ],
    providers: [
        ScopedTokensService,
        ScopedTokenRepository,
    ],
    exports: [
        ScopedTokensService,
        ScopedTokenRepository,
    ],
})
export class ScopedTokensModule { }
