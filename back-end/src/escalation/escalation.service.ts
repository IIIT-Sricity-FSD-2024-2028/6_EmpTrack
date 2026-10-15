import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateEscalationDto } from './dto/escalation.dto';
import { accessibleEmployeeIds, assertCanAccessEmployee, getActor, todayKey } from '../common/utils/access-scope.util';

@Injectable()
export class EscalationService {
  constructor(private readonly dataStore: MockDataService) {}

  // Only escalations raised by someone in the caller's own company.
  getAllEscalations(actorId: string) {
    const visible = accessibleEmployeeIds(this.dataStore, actorId);
    return this.dataStore.getEscalations().filter(e => visible.has(e.escalated_from));
  }

  createEscalation(createDto: CreateEscalationDto, actorId: string) {
    const actor = getActor(this.dataStore, actorId);
    if (!actor.companyId) {
      throw new ForbiddenException('Only company accounts can raise escalations.');
    }
    if (createDto.escalated_from && createDto.escalated_from !== actorId) {
      throw new ForbiddenException('You can only raise escalations as yourself.');
    }
    const newEsc = {
        escalation_id: 'ESC-' + Date.now(),
        ...createDto,
        escalated_from: actorId,
        escalation_date: todayKey(),
        status: "OPEN"
    };
    this.dataStore.getEscalations().push(newEsc);
    return newEsc;
  }

  private findScoped(id: string, actorId: string) {
    const esc = this.dataStore.getEscalations().find(e => e.escalation_id === id);
    if (!esc) throw new NotFoundException('Escalation not found');
    assertCanAccessEmployee(this.dataStore, actorId, esc.escalated_from);
    return esc;
  }

  rejectEscalation(id: string, actorId: string) {
    const esc = this.findScoped(id, actorId);
    if (esc.escalated_from === actorId) {
      throw new ForbiddenException('You cannot reject your own escalation.');
    }
    if (esc.status !== 'OPEN') {
      throw new ConflictException(`This escalation is already ${String(esc.status).toLowerCase()}.`);
    }
    esc.status = 'REJECTED';
    return { success: true, message: `Escalation ${id} has been rejected.` };
  }

  generateEscalationReport(id: string, actorId: string) {
    this.findScoped(id, actorId);
    return { success: true, message: `Report generated successfully for escalation ${id}.` };
  }
}
