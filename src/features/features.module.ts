import { Module } from '@nestjs/common';
import { TestModule } from './test/test.module';
import { GameInstancesModule } from './game-instances/docker.module';

@Module({
    imports: [
        TestModule,
        GameInstancesModule,
    ],
})
export class FeaturesModule { }
