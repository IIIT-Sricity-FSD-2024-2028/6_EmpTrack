import { Module } from '@nestjs/common';
import { TechnicalMemberController } from './technical-member.controller';
import { TechnicalMemberService } from './technical-member.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [TechnicalMemberController],
  providers: [TechnicalMemberService],
})
export class TechnicalMemberModule {}
