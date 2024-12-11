import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule,
  ],
  providers: [TestService],
})
export class TestModule { }
