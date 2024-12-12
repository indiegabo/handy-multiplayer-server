import { Module } from '@nestjs/common';
import { GameInstancesService } from './game-instances.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule
  ],
  providers: [GameInstancesService]
})
export class GameInstancesModule { }
