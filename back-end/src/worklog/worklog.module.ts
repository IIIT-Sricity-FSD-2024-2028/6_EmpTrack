import { Module } from '@nestjs/common';
import { WorkLogController } from './worklog.controller';
import { WorkLogService } from './worklog.service';

@Module({
  controllers: [WorkLogController],
  providers: [WorkLogService],
})
export class WorkLogModule {}
