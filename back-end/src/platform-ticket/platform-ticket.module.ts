import { Module } from '@nestjs/common';
import { TechnicalIssueController } from './technical-issue.controller';
import { SupportTicketController } from './support-ticket.controller';
import { CompanyTicketController } from './company-ticket.controller';
import { PlatformTicketService } from './platform-ticket.service';
import { NotificationModule } from '../notification/notification.module';
import { CriticalEscalationModule } from '../critical-escalation/critical-escalation.module';

@Module({
  imports: [NotificationModule, CriticalEscalationModule],
  controllers: [TechnicalIssueController, SupportTicketController, CompanyTicketController],
  providers: [PlatformTicketService],
  exports: [PlatformTicketService],
})
export class PlatformTicketModule {}
