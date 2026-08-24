import { Module } from '@nestjs/common';
import { SupportMemberController } from './support-member.controller';
import { SupportMemberService } from './support-member.service';
import { PlatformTicketModule } from '../platform-ticket/platform-ticket.module';

@Module({
  imports: [PlatformTicketModule],
  controllers: [SupportMemberController],
  providers: [SupportMemberService],
})
export class SupportMemberModule {}
