import { Module } from '@nestjs/common';
import { TestingService } from './testing.service';
import { TestGateway } from './test-gateway';
import { HMSModule } from '@hms-module/hms.module';

@Module({
  imports: [
    HMSModule,
  ],
  providers: [
    TestGateway,
    TestingService,
  ],
})
export class TestingModule { }
