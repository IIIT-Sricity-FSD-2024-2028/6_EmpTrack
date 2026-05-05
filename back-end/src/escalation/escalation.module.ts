import { Module } from '@nestjs/common';
import { EscalationController } from './escalation.controller';
import { EscalationService } from './escalation.service';

@Module({
  controllers: [EscalationController],
  providers: [EscalationService],
})
export class EscalationModule {}

