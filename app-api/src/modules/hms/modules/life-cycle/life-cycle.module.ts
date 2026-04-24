import { Module } from '@nestjs/common';
import { ShutdownModule } from './shutdown/shutdown.module';
import { InitModule } from './init/init.module';

@Module({
    imports: [
        ShutdownModule,
        InitModule,
    ],
    exports: [
        ShutdownModule,
        InitModule,
    ],
})
export class LifeCycleModule { }
