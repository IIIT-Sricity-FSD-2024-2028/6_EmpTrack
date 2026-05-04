import { Module } from '@nestjs/common';
import { DataModule } from './data/data.module';
import { EmployeeModule } from './employee/employee.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module';
import { TaskModule } from './task/task.module';
import { IssueModule } from './issue/issue.module';
import { WorkLogModule } from './worklog/worklog.module';
import { NotificationModule } from './notification/notification.module';
import { EscalationModule } from './escalation/escalation.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    DataModule,
    EmployeeModule,
    AttendanceModule,
    LeaveModule,
    TaskModule,
    IssueModule,
    WorkLogModule,
    NotificationModule,
    EscalationModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
