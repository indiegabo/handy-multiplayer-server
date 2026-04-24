import { Module, Provider } from '@nestjs/common';
import { instanceContainerProvider, INSTANCE_PROVIDER_NAME } from './instance-container-provider-resolver';
import { BetterLoggerModule } from '@hms-module/modules/better-logger/better-logger.module';

@Module({
    imports: [
        BetterLoggerModule,
    ],
    providers: [
        instanceContainerProvider
    ],
    exports: [
        INSTANCE_PROVIDER_NAME
    ]
})
export class InstanceContainersModule { }
