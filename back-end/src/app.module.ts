import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { TeamModule } from './team/team.module';
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
import { UploadModule } from './upload/upload.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger/logger.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AccessLoggingMiddleware } from './common/middleware/access-logging.middleware';
import { AdminAuditMiddleware } from './common/middleware/admin-audit.middleware';
import type { NextFunction, Request, Response } from 'express';

// API responses are per-user; never let the browser (or a proxy) keep a copy that
// could be shown again after logout, e.g. via Back/Forward or a cached GET.
function noStore(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

@Module({
  imports: [
    LoggerModule,
    ThrottlerModule.forRoot([
      {
        // Baseline: 100 requests/minute per IP across the API. Tighter limits are
        // applied per-route with @Throttle (see AuthController's login endpoint).
        ttl: 60_000,
        limit: 100,
      },
    ]),
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
    TeamModule,
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
    TechnicalMemberModule,
    UploadModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HttpExceptionFilter,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Resolves the bearer session token into the trusted role/x-actor-* headers that
    // RolesGuard and the controllers rely on - see AuthGuard.
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Applied to every route: every request needs a correlation id, an access-log
    // line and a no-store cache policy, regardless of which module handles it.
    consumer.apply(RequestIdMiddleware, AccessLoggingMiddleware, noStore).forRoutes({ path: '*', method: RequestMethod.ALL });

    // Router/module-scoped: only wired onto the administrative route groups, so it
    // genuinely does not run for e.g. /auth, /attendance, /calendar, /worklogs.
    consumer.apply(AdminAuditMiddleware).forRoutes(
      { path: 'companies', method: RequestMethod.ALL },
      { path: 'companies/*path', method: RequestMethod.ALL },
      { path: 'employees', method: RequestMethod.ALL },
      { path: 'employees/*path', method: RequestMethod.ALL },
      { path: 'platform-admins', method: RequestMethod.ALL },
      { path: 'platform-admins/*path', method: RequestMethod.ALL },
      { path: 'platform-settings', method: RequestMethod.ALL },
      { path: 'critical-escalations', method: RequestMethod.ALL },
      { path: 'critical-escalations/*path', method: RequestMethod.ALL },
    );
  }
}
