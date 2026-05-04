import { Global, Module } from '@nestjs/common';
import { MockDataService } from './mock-data.service';

@Global()
@Module({
  providers: [MockDataService],
  exports: [MockDataService],
})
export class DataModule {}
