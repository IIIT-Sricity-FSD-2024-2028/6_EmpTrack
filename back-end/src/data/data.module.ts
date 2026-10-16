import { Global, Module } from '@nestjs/common';
import { MockDataService } from './mock-data.service';
import { WorkflowPersistenceService } from './workflow-persistence.service';

@Global()
@Module({
  providers: [MockDataService, WorkflowPersistenceService],
  exports: [MockDataService, WorkflowPersistenceService],
})
export class DataModule {}

