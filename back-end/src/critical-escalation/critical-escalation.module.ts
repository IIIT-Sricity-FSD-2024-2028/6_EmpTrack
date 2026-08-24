import { Module } from '@nestjs/common';
import { CriticalEscalationController } from './critical-escalation.controller';
import { CriticalEscalationService } from './critical-escalation.service';

@Module({
  controllers: [CriticalEscalationController],
  providers: [CriticalEscalationService],
})
export class CriticalEscalationModule {}
