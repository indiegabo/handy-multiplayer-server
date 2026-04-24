import { Module } from '@nestjs/common';
import { GameInstancesService } from './game-instances.service';
import { GameInstanceGateway } from './game-instances.gateway';
import { InstanceContainersModule } from './instance-containers/instance-containers.module';
import { BetterLoggerModule } from '@hms-module/modules/better-logger/better-logger.module';
import { GameInstancesController } from './game-instances.controller';
import { UsersModule } from '../users/users.module';
import { GenericValidationsModule } from '../generic-validations/generic-validations.module';
import { AuthModule } from '../auth/auth.module';
import { ShutdownModule } from '@hms-module/modules/life-cycle/shutdown/shutdown.module';
import { LifeCycleModule } from '@hms-module/modules/life-cycle/life-cycle.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    BetterLoggerModule,
    GenericValidationsModule,
    InstanceContainersModule,
    ShutdownModule,
    LifeCycleModule,
    UsersModule,
  ],
  controllers: [
    GameInstancesController,
  ],
  providers: [
    GameInstancesService,
    GameInstanceGateway,
  ],
  exports: [
    GameInstancesService,
  ]
})
export class GameInstancesModule { }
