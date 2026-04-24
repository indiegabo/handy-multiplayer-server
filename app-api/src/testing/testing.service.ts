import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { StepResult } from '@hms-module/modules/life-cycle/init/types';
import { InitStep } from '@hms-module/modules/life-cycle/init/decorators';
import { runCLI } from 'jest';
import path from 'path';
import { Subscription } from 'rxjs';
import { GameInstancesService } from '@hms-module/modules/game-instances/game-instances.service';

@Injectable()
export class TestingService implements OnModuleInit, OnModuleDestroy {
    private initializationSubscription?: Subscription;

    constructor(
        private logger: BetterLogger,
        private gameInstancesService: GameInstancesService,
    ) {
        this.logger.setContext(TestingService.name);
        this.logger.log('Created');
    }

    onModuleInit() { }

    onModuleDestroy() { }
}