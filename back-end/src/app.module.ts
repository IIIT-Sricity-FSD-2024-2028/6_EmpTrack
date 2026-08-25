import { Module } from '@nestjs/common';
import { DataModule } from './data/data.module';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module';
import { TaskModule } from './task/task.module';
import { IssueModule } from './issue/issue.module';
import { WorkLogModule } from './worklog/worklog.module';
import { NotificationModule } from './notification/notification.module';
import { EscalationModule } from './escalation/escalation.module';
import { CalendarModule } from './calendar/calendar.module';
import { InvitationModule } from './invitation/invitation.module';
import { CompanyModule } from './company/company.module';
import { PlatformAdminModule } from './platform-admin/platform-admin.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { RevenueModule } from './revenue/revenue.module';
import { PaymentModule } from './payment/payment.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { CriticalEscalationModule } from './critical-escalation/critical-escalation.module';
import { PlatformSettingsModule } from './platform-settings/platform-settings.module';
import { PlatformTeamModule } from './platform-team/platform-team.module';
import { PlatformTicketModule } from './platform-ticket/platform-ticket.module';
import { PlatformDashboardModule } from './platform-dashboard/platform-dashboard.module';
import { SupportMemberModule } from './support-member/support-member.module';
import { TechnicalMemberModule } from './technical-member/technical-member.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    DataModule,
    AuthModule,
    EmployeeModule,
    AttendanceModule,
    LeaveModule,
    TaskModule,
    IssueModule,
    WorkLogModule,
    NotificationModule,
    EscalationModule,
    CalendarModule,
    InvitationModule,
    CompanyModule,
    PlatformAdminModule,
    SubscriptionModule,
    RevenueModule,
    PaymentModule,
    AnalyticsModule,
    ActivityLogModule,
    CriticalEscalationModule,
    PlatformSettingsModule,
    PlatformTeamModule,
    PlatformTicketModule,
    PlatformDashboardModule,
    SupportMemberModule,
    TechnicalMemberModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

